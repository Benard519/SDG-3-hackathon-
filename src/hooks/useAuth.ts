import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email || '',
          full_name: authUser.user.user_metadata?.full_name || 'User',
          role: 'caregiver', // Default role
          phone: authUser.user.phone || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (err: any) {
      console.error('Sign in exception:', err);
      return { data: null, error: { message: err.message } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'caregiver' | 'family', phone?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone
          }
        }
      });

      if (data.user && !error) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            phone: phone || null
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
      
      if (error) {
        console.error('Sign up error:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (err: any) {
      console.error('Sign up exception:', err);
      return { data: null, error: { message: err.message } };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserProfile(null);
    }
    return { error };
  };

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
  };
}