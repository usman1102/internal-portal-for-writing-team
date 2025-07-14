import { Request, Response } from "express";
import { storage } from "./storage";
import { PaymentStatus, UserRole } from "@shared/schema";

export async function getPayments(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payments = await storage.getPaymentsByUser(userId);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
}

export async function updatePaymentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Only superadmin can update payment status
    if (req.user?.role !== UserRole.SUPERADMIN) {
      return res.status(403).json({ error: "Forbidden: Only superadmin can update payment status" });
    }

    if (!status || !Object.values(PaymentStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const payment = await storage.updatePaymentStatus(parseInt(id), status);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
}