export interface StoredRegistration {
  id: string;
  reference: string;
  submittedAt: string;
  paid?: boolean;
  driverName: string;
  copilotName: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  extraParticipants: number;
  extraNames: string[];
  mealChoices: Array<{ include: boolean; menu: string }>;
  mealCost: number;
  total: number;
  lang: string;
}
