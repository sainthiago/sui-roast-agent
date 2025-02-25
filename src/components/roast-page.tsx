"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Flame, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface RoastResponse {
  roast?: string;
  error?: string;
}

export const RoastPage = () => {
  const [address, setAddress] = useState("");
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastResult, setRoastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoast = async () => {
    if (!address) return;

    setIsRoasting(true);
    setError(null);
    setRoastResult(null);

    try {
      // First, validate the address format
      if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
        throw new Error("Please enter a valid SUI wallet address");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch("/api/roast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data: RoastResponse;
        try {
          data = await response.json();
        } catch (e) {
          console.error("Error parsing JSON:", e);
          throw new Error("Failed to parse server response");
        }

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        if (!data.roast) {
          throw new Error("No roast received from server");
        }

        setRoastResult(data.roast);
      } catch (error) {
        const err = error as Error;
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Please try again.");
        }
        throw err;
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error in handleRoast:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || "Failed to generate roast. Please try again.");
    } finally {
      setIsRoasting(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value.trim());
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isRoasting && address) {
      handleRoast();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-orange-600 mb-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          >
            🔥 SUI Roast Agent 🔥
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Prepare to get absolutely grilled based on your wallet choices!
          </motion.p>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter SUI wallet address (if you dare...)"
                  value={address}
                  onChange={handleAddressChange}
                  onKeyDown={handleKeyPress}
                  className="text-lg"
                  disabled={isRoasting}
                />
              </div>
              <Button
                onClick={handleRoast}
                disabled={!address || isRoasting}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isRoasting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Roasting...
                  </div>
                ) : (
                  <>
                    <Flame className="w-5 h-5 mr-2" />
                    Roast Me!
                  </>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <Dialog open={!!roastResult} onOpenChange={() => setRoastResult(null)}>
          <DialogContent className="max-w-2xl h-[500px] bg-gradient-to-br from-orange-100 to-red-100">
            <DialogHeader>
              <DialogTitle className="md:text-2xl font-bold text-orange-600 flex items-center gap- justify-center text-md">
                <Flame className="w-6 h-6" />
                Your Roast is Served! 🔥
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 overflow-y-scroll">
              {roastResult?.split("\n").map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="mb-4 text-gray-800 last:mb-0 text-sm"
                >
                  {line}
                </motion.p>
              ))}
            </div>
            <Button
              variant="secondary"
              asChild
              className="inline-flex w-full items-center gap-2 text-black"
            >
              <Link
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `I just got roasted by SUI Roast Agent: check it out at https://sui-roast-agent.vercel.app/ || ${
                    roastResult?.toString() || ""
                  }`
                )}`}
                target="_blank"
              >
                Share on X
              </Link>
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
