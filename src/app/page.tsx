"use client";

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
import { useState } from "react";

import { RoastResult } from "@/components/roast-result";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateRoast } from "../../utils/actions";

export default function RoastPage() {
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
      const result = await generateRoast(address);
      if (result.includes("Oops!") || result.includes("Hey there!")) {
        setError(result);
      } else {
        setRoastResult(result);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate roast. Please try again.");
    } finally {
      setIsRoasting(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setError(null);
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Flame className="w-6 h-6" />
                Your Roast is Served! 🔥
              </DialogTitle>
            </DialogHeader>
            <RoastResult roast={roastResult || ""} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
