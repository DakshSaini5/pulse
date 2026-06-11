import { Hospital } from '@prisma/client';

// Calculates distance in km using the Haversine Formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export interface HospitalWithSpecialties extends Hospital {
  specialties: Array<{
    specialty: {
      name: string;
      description: string;
    };
  }>;
}

export const scoreHospital = (
  hospital: HospitalWithSpecialties,
  targetSpecialty: string,
  userLat: number,
  userLng: number
) => {
  // 1. Specialty Match Score (40%)
  const hasSpecialty = hospital.specialties.some(
    s => s.specialty.name.toLowerCase() === targetSpecialty.toLowerCase()
  );
  const specialtyScore = hasSpecialty ? 100 : 0;

  // 2. Distance Score (30%)
  const distance = calculateDistance(userLat, userLng, hospital.latitude, hospital.longitude);
  let distanceScore = 0;
  if (distance <= 2) distanceScore = 100;
  else if (distance <= 5) distanceScore = 85;
  else if (distance <= 10) distanceScore = 70;
  else if (distance <= 20) distanceScore = 50;
  else distanceScore = 30;

  // 3. Ratings Score (20%)
  const ratingScore = (hospital.rating / 5.0) * 100;

  // 4. Availability Score (10%)
  const availabilityScore = hospital.emergencyAvailable ? 100 : 40;

  // Calculate Weighted Total Score
  const totalScore = Math.round(
    specialtyScore * 0.4 +
    distanceScore * 0.3 +
    ratingScore * 0.2 +
    availabilityScore * 0.1
  );

  // Compile matching justification log
  let explanation = `Recommended because `;
  if (hasSpecialty) {
    explanation += `this clinic provides expert ${targetSpecialty} services, `;
  } else {
    explanation += `this facility hosts general medical consultation, `;
  }
  
  if (distance <= 5) {
    explanation += `is located highly close to you (${distance.toFixed(1)} km away), `;
  } else {
    explanation += `is located within transit range (${distance.toFixed(1)} km), `;
  }

  if (hospital.rating >= 4.0) {
    explanation += `maintains excellent patient reviews (${hospital.rating.toFixed(1)} stars), `;
  } else {
    explanation += `is standard rated, `;
  }

  if (hospital.emergencyAvailable) {
    explanation += `and operates a 24/7 active emergency department.`;
  } else {
    explanation += `and works general OPD hours.`;
  }

  return {
    score: totalScore,
    distance,
    explanation
  };
};
