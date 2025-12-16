import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/app/_services/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting kulup-form-config API...');
    
    console.log('Using existing Supabase client');
    
    // First, let's test basic connection
    console.log('Testing basic connection...');
          const { data: testData, error: testError } = await supabase
            .from('unilab_vision_form_configs')
            .select('id, form_name')
            .limit(1);
    
    console.log('Test query result:', { testData, testError });
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 });
    }
    
    console.log('Basic connection successful, fetching kulup_form...');
    
    // Fetch form configuration
          const { data: formConfig, error: configError } = await supabase
            .from('unilab_vision_form_configs')
            .select('*')
            .eq('form_name', 'kulup_form')
            .eq('is_active', true)
            .single();

    console.log('Form config result:', { formConfig, configError });

    if (configError) {
      console.error('Error fetching form config:', configError);
      return NextResponse.json({ 
        error: 'Form configuration not found',
        details: configError.message,
        code: configError.code
      }, { status: 404 });
    }

    console.log('Form config found, fetching fields...');

    // Fetch form fields
          const { data: formFields, error: fieldsError } = await supabase
            .from('unilab_vision_form_fields')
            .select('*')
            .eq('form_config_id', formConfig.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          // Remove duplicates based on field_key
          const uniqueFields = formFields?.filter((field, index, self) => 
            index === self.findIndex(f => f.field_key === field.field_key)
          ) || [];

    console.log('Form fields result:', { formFields, fieldsError });

    if (fieldsError) {
      console.error('Error fetching form fields:', fieldsError);
      return NextResponse.json({ 
        error: 'Form fields not found',
        details: fieldsError.message,
        code: fieldsError.code
      }, { status: 404 });
    }

          console.log('Success! Returning data...');
          return NextResponse.json({
            success: true,
            config: formConfig,
            fields: uniqueFields
          });

  } catch (error) {
    console.error('Error in kulup-form-config API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
