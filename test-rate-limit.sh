#!/bin/bash
# Script de Testing para Rate Limiting
# Ejecutar desde Git Bash o WSL: bash test-rate-limit.sh

echo "=== TEST DE RATE LIMITING ==="
echo ""

BASE_URL="http://localhost:3000"

# Verificar servidor
echo "Verificando servidor..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|404"; then
    echo "✓ Servidor corriendo en $BASE_URL"
else
    echo "✗ Error: El servidor no está corriendo"
    echo "  Por favor ejecuta: npm run dev"
    exit 1
fi

echo ""
echo "=== TEST 1: Auth Register (Límite: 5 req/10s) ==="
echo "Enviando 7 requests..."
echo ""

for i in {1..7}; do
    echo "Request $i:"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"test$i@test.com\",\"password\":\"123456\",\"name\":\"Test$i\"}" \
        -i)

    HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    REMAINING=$(echo "$RESPONSE" | grep -i "x-ratelimit-remaining" | cut -d: -f2 | tr -d ' \r')
    LIMIT=$(echo "$RESPONSE" | grep -i "x-ratelimit-limit" | cut -d: -f2 | tr -d ' \r')

    if [ "$HTTP_CODE" == "429" ]; then
        echo "  ✓ Status 429 RATE LIMITED (esperado después de 5)"
    else
        echo "  ✓ Status $HTTP_CODE | Remaining: $REMAINING/$LIMIT"
    fi

    sleep 1
done

echo ""
echo "=== TEST 2: Coupon Validate (Límite: 10 req/60s) ==="
echo "Enviando 12 requests..."
echo ""

for i in {1..12}; do
    echo "Request $i:"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/coupons/validate" \
        -H "Content-Type: application/json" \
        -d '{"code":"TEST10","email":"test@test.com","subtotal":1000}' \
        -i)

    HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    REMAINING=$(echo "$RESPONSE" | grep -i "x-ratelimit-remaining" | cut -d: -f2 | tr -d ' \r')
    LIMIT=$(echo "$RESPONSE" | grep -i "x-ratelimit-limit" | cut -d: -f2 | tr -d ' \r')

    if [ "$HTTP_CODE" == "429" ]; then
        echo "  ✓ Status 429 RATE LIMITED (esperado después de 10)"
    else
        echo "  ✓ Status $HTTP_CODE | Remaining: $REMAINING/$LIMIT"
    fi

    sleep 0.5
done

echo ""
echo "=== RESUMEN ==="
echo "✓ Tests completados"
echo ""
echo "Los límites están funcionando correctamente si viste:"
echo "  - Test 1: Primeros 5 requests OK, luego 429"
echo "  - Test 2: Primeros 10 requests OK, luego 429"
echo ""
echo "Puedes ver las estadísticas en: https://console.upstash.com"
echo ""
