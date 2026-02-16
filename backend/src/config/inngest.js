import { Inngest } from "inngest";
import {ENV } from "../config/env.js";

// Initialize Inngest with your account's unique identifier to link events and functions
export const inngest = new Inngest({
  name: "SupplyTigerGOA Inngest Client",
  id: ENV.INNGEST_ID,
});

// Every time a new user is created in Clerk, sync them to our database
const syncUser = inngest.createFunction(
  {
    id: "sync-user-to-db",
    name: "Sync New User",
    description: "Sync new users to the database from Clerk",
  },
  { event: "clerk/user.created" },
  // todo: implement function logic
    async ({ event, step, db }) => {
        console.log("New user created event received:", event);
        // Implement user synchronization logic here
    }
);
export const functions = [syncUser];