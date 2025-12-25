/**
 * Test de ejemplo para verificar configuración
 *
 * Este test verifica que Jest está configurado correctamente.
 */

describe('Setup Test', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should perform basic math', () => {
    expect(2 + 2).toBe(4)
  })

  it('should handle strings', () => {
    const greeting = 'Hello World'
    expect(greeting).toContain('Hello')
    expect(greeting).toHaveLength(11)
  })

  it('should handle arrays', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers).toContain(3)
  })

  it('should handle objects', () => {
    const user = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
    }

    expect(user).toHaveProperty('name')
    expect(user.name).toBe('John Doe')
    expect(user).toMatchObject({ age: 30 })
  })

  it('should handle async operations', async () => {
    const fetchData = () => Promise.resolve('data')
    const result = await fetchData()
    expect(result).toBe('data')
  })

  it('should access environment variables', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(process.env.MP_ACCESS_TOKEN).toBe('test-mp-token')
  })
})
