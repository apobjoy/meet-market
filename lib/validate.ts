import { z } from "zod";

export const JoinSchema = z.object({
  joinCode: z.string().min(6).max(64),
  firstName: z.string().min(1).max(40),
  email: z.string().email(),
  mobile: z.string().min(6).max(30),
  trafficLight: z.enum(["green", "yellow", "red"]),
  consent: z.literal(true),
});

export const PicksSchema = z.object({
  joinCode: z.string().min(6).max(64),
  picks: z.array(z.number().int().positive()).max(5),
});

export const AdminLoginSchema = z.object({ adminPassword: z.string().min(1) });

export const AdminSeedBadgesSchema = z.object({
  adminPassword: z.string().min(1),
  eventId: z.string().uuid(),
  from: z.number().int().positive().max(200),
  to: z.number().int().positive().max(200),
});

export const AdminCreateEventSchema = z.object({
  adminPassword: z.string().min(1),
  title: z.string().min(3).max(120),
  startsAt: z.string().min(10),
  submissionsCloseAt: z.string().min(10),
});

export const AdminSendResultsSchema = z.object({
  adminPassword: z.string().min(1),
  eventId: z.string().uuid(),
});
