import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

interface Props {
  triggerToast: (icon: string, message: string) => void;
}

export function CiviQAdmin({ triggerToast }: Props) {
  const [pendingAuthorities, setPendingAuthorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "authority"), where("status", "==", "pending"));
      const snap = await getDocs(q);
      setPendingAuthorities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      triggerToast("❌", "Failed to load pending authorities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: "active" | "rejected") => {
    try {
      await updateDoc(doc(db, "users", id), { status: action });
      triggerToast("✅", `Authority ${action === "active" ? "approved" : "rejected"} successfully.`);
      fetchPending();
    } catch (e) {
      console.error(e);
      triggerToast("❌", "Action failed.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel: Authority Verifications</h2>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : pendingAuthorities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed rounded-xl">
          No pending authority registrations.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingAuthorities.map(auth => (
            <div key={auth.id} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-800">{auth.displayName}</h4>
                <div className="text-sm text-gray-500">
                  {auth.email} • {auth.department} • {auth.designation} • Ward: {auth.ward}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(auth.id, "active")}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm transition"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleAction(auth.id, "rejected")}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
