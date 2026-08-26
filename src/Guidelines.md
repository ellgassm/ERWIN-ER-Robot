# ERWIN Project Guidelines

**Project:** ERWIN  
**Working Name:** ERWIN  
**Project Type:** Healthcare Robotics Hackathon Prototype  
**Primary Platform:** TurtleBot3 Burger + ROS2  
**Frontend:** React + TypeScript + Vite  
**Database:** Supabase PostgreSQL  
**Development Stage:** Hackathon MVP  

# 1. Project Overview

ERWIN is an autonomous emergency-room waiting-room assistant designed to help monitor and support patients while they wait for care.

The core concept is:

> A patient waiting in an emergency department can request ERWIN from their waiting location. ERWIN autonomously navigates to the patient, provides a friendly interaction, optionally reassesses basic measurements such as heart rate and pain level, compares reassessment measurements against the patient's initial triage baseline when available, and communicates meaningful changes to medical staff.

ERWIN is intended as a **prototype demonstrating human-robot interaction, autonomous navigation, continuous reassessment, and healthcare workflow integration**.

This is a hackathon prototype, not a production medical device.

The implementation should prioritize:

1. Reliability
2. Demonstrability
3. Simplicity
4. Clear architecture
5. Easy debugging
6. Extensibility
7. Human-centered interaction

Do not sacrifice a working MVP for unnecessary technical sophistication.

---

# 2. Current MVP

The primary MVP demonstration should prove the following workflow:

```text
Patient
Scans QR code at waiting location
Mobile web application opens
Waiting location is identified automatically

Patient optionally identifies themselves

Patient requests ERWIN

Request enters session queue

Robot receives request

Robot navigates to waiting location
Robot arrives and greets patient

Patient chooses an available interaction

Heart rate and/or pain level can be collected

Measurements are stored
Measurements can be compared against baseline

Session completes

Robot serves next request or returns to base