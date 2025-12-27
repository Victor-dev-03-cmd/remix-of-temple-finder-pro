
import { supabase } from './supabase/client';

export const auth = {
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  signUp: async (email, password) => {
    return await supabase.auth.signUp({ email, password });
  },
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
};
