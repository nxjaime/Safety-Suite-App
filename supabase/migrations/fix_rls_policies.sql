-- Migration: Fix Missing RLS Policies
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-12

-- ============================================
-- FIX COACHING_PLANS TABLE (MAIN FIX)
-- ============================================
-- Add missing UPDATE policy for coaching_plans
CREATE POLICY "Public Update" ON coaching_plans FOR UPDATE USING (true);

-- Add missing DELETE policy for coaching_plans (THIS IS THE MAIN FIX)
CREATE POLICY "Public Delete" ON coaching_plans FOR DELETE USING (true);

-- ============================================
-- FIX TASKS TABLE
-- ============================================
-- Add missing DELETE policy for tasks  
CREATE POLICY "Public Delete" ON tasks FOR DELETE USING (true);

-- ============================================
-- FIX RISK_EVENTS TABLE (preventive)
-- ============================================
-- Add missing UPDATE policy for risk_events
CREATE POLICY "Public Update" ON risk_events FOR UPDATE USING (true);

-- Add missing DELETE policy for risk_events
CREATE POLICY "Public Delete" ON risk_events FOR DELETE USING (true);
