/**
 * Mock de Supabase Client para tests
 *
 * Este mock simula las operaciones de Supabase sin hacer llamadas reales a la base de datos.
 * Puedes personalizar las respuestas en cada test según sea necesario.
 */

export const mockSupabaseClient = {
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => resolve({ data: [], error: null })),
  })),

  rpc: jest.fn((functionName: string, params?: any) =>
    Promise.resolve({ data: null, error: null })
  ),

  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    updateUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
  },

  storage: {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(),
        error: null
      }),
      remove: jest.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        error: null
      }),
      getPublicUrl: jest.fn((path: string) => ({
        data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` }
      })),
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://test.supabase.co/signed-url' },
        error: null
      }),
    })),
  },

  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  }),
}

// Mock del módulo completo de Supabase Admin
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockSupabaseClient),
}))

// Mock del módulo completo de Supabase Server
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock del módulo completo de Supabase Client
jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: jest.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
}))

/**
 * Helper para resetear todos los mocks de Supabase entre tests
 */
export const resetSupabaseMocks = () => {
  jest.clearAllMocks()

  // Restaurar comportamiento por defecto
  mockSupabaseClient.from = jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => resolve({ data: [], error: null })),
  }))

  mockSupabaseClient.rpc = jest.fn((functionName: string, params?: any) =>
    Promise.resolve({ data: null, error: null })
  )
}

/**
 * Helper para mockear una respuesta exitosa de select
 */
export const mockSupabaseSelect = (data: any[]) => {
  mockSupabaseClient.from = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: data[0] || null, error: null }),
    then: jest.fn((resolve) => resolve({ data, error: null })),
  })) as any
}

/**
 * Helper para mockear una respuesta exitosa de insert
 */
export const mockSupabaseInsert = (data: any) => {
  mockSupabaseClient.from = jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  })) as any
}

/**
 * Helper para mockear un error de Supabase
 */
export const mockSupabaseError = (message: string) => {
  const error = new Error(message)
  mockSupabaseClient.from = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error }),
    then: jest.fn((resolve) => resolve({ data: null, error })),
  })) as any
}

/**
 * Helper para mockear un RPC exitoso
 */
export const mockSupabaseRPC = (functionName: string, returnData: any) => {
  mockSupabaseClient.rpc = jest.fn((name: string) => {
    if (name === functionName) {
      return Promise.resolve({ data: returnData, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })
}
