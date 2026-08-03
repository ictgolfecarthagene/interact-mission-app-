'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast"; // assuming shadcn-ui

export function NotificationListener({ userRole }) {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for new actions
    const actionSub = supabase
      .channel('public:submitted_actions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submitted_actions' }, (payload) => {
        if (['comite_national', 'chef_mission_inter', 'chef_mission_digi'].includes(userRole)) {
          toast({
            title: "Nouvelle action soumise!",
            description: `${payload.new.club} a soumis une action.`,
          });
        }
      }).subscribe();

    // Listen for Ahkili messages (Only for Chef Mission Inter)
    const ahkiliSub = supabase
      .channel('public:ahkili_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ahkili_messages' }, (payload) => {
        if (userRole === 'chef_mission_inter') {
          toast({
            title: "Nouveau message أحكيلي",
            description: `Message reçu de ${payload.new.club}.`,
          });
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(actionSub);
      supabase.removeChannel(ahkiliSub);
    };
  }, [userRole]);

  return null;
}