import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabaseUrl = 'https://fslwgqrhvstzcqkhxcug.supabase.co';
  private readonly supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbHdncXJodnN0emNxa2h4Y3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzU1OTUsImV4cCI6MjEwNjYxMTU5NX0.ISNixEJ_N4P3smObn3nT8xccpZPSdAGE4JsVc-GE88U';

  public readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
  }
}