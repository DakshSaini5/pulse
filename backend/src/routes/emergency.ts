import express, { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db'; // BUG-03 FIX: Use shared singleton instead of creating a new instance
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { sosIpLimiter, sosUserLimiter } from '../middleware/rateLimiter';
import twilio from 'twilio';

const router = express.Router();

const panicPayloadSchema = z.object({
  lat: z.number().finite('Latitude must be a finite number.').min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
  lng: z.number().finite('Longitude must be a finite number.').min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.'),
  note: z.string().trim().max(200).optional(),
});

// Initialize Twilio client (graceful fallback if keys are missing)
let twilioClient: twilio.Twilio | null = null;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized for Emergency SMS');
  } catch (err) {
    console.error('❌ Failed to initialize Twilio client:', err);
  }
}

// GET /api/emergency/contacts
router.get('/contacts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(contacts);
  } catch (err) {
    console.error('Error fetching emergency contacts:', err);
    return res.status(500).json({ message: 'Failed to fetch contacts.' });
  }
});

// POST /api/emergency/contacts
router.post('/contacts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { name, phoneNumber, relationship } = req.body;
  if (!name || !phoneNumber || !relationship) {
    return res.status(400).json({ message: 'Name, phone number, and relationship are required.' });
  }

  // BUG-19 FIX: Validate phone number format (E.164 Indian: +91XXXXXXXXXX or 10-digit)
  const normalised = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
  const INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;
  if (!INDIAN_PHONE_REGEX.test(normalised)) {
    return res.status(400).json({ message: 'Please provide a valid Indian mobile number (10 digits starting with 6-9).' });
  }

  try {
    // Check if limit reached (e.g., max 5 contacts)
    const count = await prisma.emergencyContact.count({ where: { userId: req.user!.id } });
    if (count >= 5) {
      return res.status(400).json({ message: 'Maximum 5 emergency contacts allowed.' });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        userId: req.user!.id,
        name,
        phoneNumber: normalised, // BUG-19: always store in E.164 format
        relationship,
      },
    });
    return res.status(201).json(contact);
  } catch (err) {
    console.error('Error adding emergency contact:', err);
    return res.status(500).json({ message: 'Failed to add contact.' });
  }
});

// DELETE /api/emergency/contacts/:id
router.delete('/contacts/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const contact = await prisma.emergencyContact.findUnique({ where: { id } });
    if (!contact || contact.userId !== req.user!.id) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    
    await prisma.emergencyContact.delete({ where: { id } });
    return res.json({ message: 'Contact deleted successfully.' });
  } catch (err) {
    console.error('Error deleting emergency contact:', err);
    return res.status(500).json({ message: 'Failed to delete contact.' });
  }
});

// POST /api/emergency/panic
router.post('/panic', authenticateToken, sosIpLimiter, sosUserLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = panicPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Valid finite latitude (-90 to 90) and longitude (-180 to 180) are required.',
    });
  }

  const { lat, lng } = parsed.data;
  const userId = req.user!.id;

  try {
    // Atomic 15-second duplicate-submission guard to prevent accidental double-tap SMS bursts
    const dedupKey = `sos_dedup:${userId}`;
    const dedupId = crypto.randomUUID();
    const dedupRows = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
      VALUES (${dedupId}, ${dedupKey}, 1, NOW() + INTERVAL '15 seconds', NOW(), NOW(), NOW())
      ON CONFLICT ("identifier") DO UPDATE SET
        "lockedUntil" = NOW() + INTERVAL '15 seconds',
        "lastFailedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "AccountLockout"."lockedUntil" IS NULL OR "AccountLockout"."lockedUntil" <= NOW()
      RETURNING "id";
    `;
    if (!dedupRows || dedupRows.length === 0) {
      return res.status(429).json({
        message: 'Emergency alert was just dispatched. Please wait a few seconds before sending again.',
      });
    }

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
    });

    if (contacts.length === 0) {
      return res.status(400).json({ message: 'No emergency contacts configured.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const locationLink = `https://maps.google.com/?q=${encodeURIComponent(String(lat))},${encodeURIComponent(String(lng))}`;
    const messageBody = `EMERGENCY ALERT: ${user?.name || 'A Pulse user'} has pressed the PANIC button in the Pulse app and requires immediate help. Location: ${locationLink}`;

    const dispatchResults = [];

    for (const contact of contacts) {
      // Smart Phone Number Normalizer for Twilio Compatibility
      let recipientPhone = contact.phoneNumber.trim().replace(/[-\s()]/g, '');
      if (!recipientPhone.startsWith('+')) {
        if (recipientPhone.startsWith('91') && recipientPhone.length === 12) {
          recipientPhone = '+' + recipientPhone;
        } else if (recipientPhone.length === 10) {
          recipientPhone = '+91' + recipientPhone;
        }
      }

      if (twilioClient && twilioPhoneNumber) {
        try {
          const msg = await twilioClient.messages.create({
            body: messageBody,
            from: twilioPhoneNumber,
            to: recipientPhone,
          });
          console.log(`📱 Emergency SMS dispatched for user ${userId} (SID: ${msg.sid})`);
          dispatchResults.push({ name: contact.name, status: 'sent', phone: recipientPhone });
        } catch (smsErr) {
          console.error(`📱 Emergency SMS dispatch failed for user ${userId}`);
          dispatchResults.push({ name: contact.name, status: 'failed', phone: recipientPhone });
        }
      } else {
        // Simulation mode (never log coordinates or phone numbers)
        console.log(`[SIMULATION] 🚨 Emergency alert simulated for user ${userId} (${contacts.length} contacts)`);
        dispatchResults.push({ name: contact.name, status: 'simulated_sent', phone: recipientPhone });
      }
    }

    return res.json({
      message: 'Emergency alerts dispatched.',
      results: dispatchResults,
      simulated: !twilioClient
    });
  } catch (err) {
    console.error(`Error triggering panic for user ${userId}`);
    return res.status(500).json({ message: 'Failed to trigger panic alert.' });
  }
});

export default router;
