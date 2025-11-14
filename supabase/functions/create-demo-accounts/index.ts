import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoAccount {
  email: string
  password: string
  employee_number: string
  full_name: string
  department: string
  role?: 'hr_admin' | 'employee'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Creating demo accounts...')

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const demoAccounts: DemoAccount[] = [
      {
        email: 'hr@autorabit.com',
        password: 'HR123456!',
        employee_number: 'HR001',
        full_name: 'HR Manager',
        department: 'HR',
        role: 'hr_admin'
      },
      {
        email: 'employee@autorabit.com',
        password: 'Emp123456!',
        employee_number: 'EMP001',
        full_name: 'Demo Employee',
        department: 'Employee',
        role: 'employee'
      },
      {
        email: 'vendor@food.com',
        password: 'Vendor123!',
        employee_number: 'VENDOR_001',
        full_name: 'Vendor Partner',
        department: 'Vendor'
      }
    ]

    const results = []

    for (const account of demoAccounts) {
      console.log(`Creating account for ${account.email}...`)
      
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUser?.users?.some(u => u.email === account.email)

      if (userExists) {
        console.log(`User ${account.email} already exists, skipping...`)
        results.push({ email: account.email, status: 'already_exists' })
        continue
      }

      // Create user with admin API
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          employee_number: account.employee_number,
          full_name: account.full_name,
          company_email: account.email,
          department: account.department
        }
      })

      if (userError) {
        console.error(`Error creating user ${account.email}:`, userError)
        results.push({ email: account.email, status: 'error', error: userError.message })
        continue
      }

      console.log(`User ${account.email} created successfully`)

      // Assign role if specified (for HR and employee)
      if (account.role && userData.user) {
        const { error: roleError } = await supabaseAdmin
          .from('admin_roles')
          .upsert({
            user_id: userData.user.id,
            role: account.role
          })

        if (roleError) {
          console.error(`Error assigning role to ${account.email}:`, roleError)
        } else {
          console.log(`Role ${account.role} assigned to ${account.email}`)
        }
      }

      results.push({ email: account.email, status: 'created', user_id: userData.user?.id })
    }

    console.log('Demo accounts creation completed:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Demo accounts processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-demo-accounts function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
