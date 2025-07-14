import { Request, Response } from "express";
import { storage } from "./storage";
import { PaymentStatus, UserRole } from "@shared/schema";

export async function getPayments(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // If user is superadmin, get all payments; otherwise get user's payments
    const payments = req.user?.role === UserRole.SUPERADMIN 
      ? await storage.getAllPayments()
      : await storage.getPaymentsByUser(userId);
    
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
}

export async function getPaymentsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user has permission to view this user's payments
    const targetUserId = parseInt(userId);
    
    // Superadmin can view all payments
    if (currentUser.role === UserRole.SUPERADMIN) {
      const payments = await storage.getPaymentsByUser(targetUserId);
      return res.json(payments);
    }

    // Team leads can view their team members' payments
    if (currentUser.role === UserRole.TEAM_LEAD) {
      // Get the target user to check team membership
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if the target user is in the team that this user leads
      const teams = await storage.getTeamsByLeader(currentUser.id);
      const teamIds = teams.map(team => team.id);
      
      if (targetUser.teamId && teamIds.includes(targetUser.teamId)) {
        const payments = await storage.getPaymentsByUser(targetUserId);
        return res.json(payments);
      }
    }

    // Users can only view their own payments
    if (currentUser.id === targetUserId) {
      const payments = await storage.getPaymentsByUser(targetUserId);
      return res.json(payments);
    }

    return res.status(403).json({ error: "Access denied" });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ error: "Failed to fetch user payments" });
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