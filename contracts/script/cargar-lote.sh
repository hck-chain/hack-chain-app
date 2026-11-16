#!/usr/bin/env bash
#
# Carga un lote de asignaciones de preventa y lo verifica contra la cadena.
#
# Implementa el protocolo acordado: antes de enviar comprueba que el lote no haya
# entrado ya, y despues confirma que los totales en cadena se movieron exactamente
# lo esperado. Si algo no cuadra, se detiene.
#
#   ./script/cargar-lote.sh lotes/lote-07.csv
#
# El CSV: una fila por direccion, sin encabezado, "direccion,cantidad_en_wei".
# Direcciones en minuscula. Cantidades enteras. Sin duplicados dentro del archivo.
#
# Variables de entorno requeridas:
#   PRESALE_ADDRESS   contrato de preventa
#   RPC_URL           nodo de la red
#   KEYSTORE_ACCOUNT  nombre de la cuenta en `cast wallet` con ADMIN_ROLE
#   PASSWORD_FILE     archivo con la clave de esa cuenta

set -euo pipefail

CSV="${1:-}"
[[ -n "$CSV" ]] || { echo "uso: $0 <archivo-lote.csv>" >&2; exit 2; }
[[ -f "$CSV" ]] || { echo "ERROR: no existe $CSV" >&2; exit 2; }

for v in PRESALE_ADDRESS RPC_URL KEYSTORE_ACCOUNT PASSWORD_FILE; do
  [[ -n "${!v:-}" ]] || { echo "ERROR: falta la variable $v" >&2; exit 2; }
done

cast_call() { cast call "$PRESALE_ADDRESS" "$@" --rpc-url "$RPC_URL" | awk '{print $1}'; }

# ---------------------------------------------------------------- 1. validar
echo "== Validando $CSV"

if grep -qvE '^0x[0-9a-f]{40},[0-9]+$' "$CSV"; then
  echo "ERROR: filas con formato invalido (se espera 0x<40 hex minuscula>,<entero>):" >&2
  grep -nvE '^0x[0-9a-f]{40},[0-9]+$' "$CSV" >&2
  exit 1
fi

DUPES=$(cut -d, -f1 "$CSV" | sort | uniq -d)
if [[ -n "$DUPES" ]]; then
  echo "ERROR: direcciones repetidas dentro del lote. Consolidalas antes de cargar:" >&2
  echo "$DUPES" >&2
  exit 1
fi

FILAS=$(wc -l < "$CSV")
SUMA=$(cut -d, -f2 "$CSV" | paste -sd+ | bc)
echo "   filas: $FILAS"
echo "   suma:  $SUMA wei"

if (( FILAS > 250 )); then
  echo "ERROR: $FILAS direcciones es demasiado para un lote. Usa 100-200." >&2
  exit 1
fi

# -------------------------------------------- 2. estado previo e idempotencia
echo "== Leyendo el estado actual de la cadena"
ANTES_TOTAL=$(cast_call "totalAllocated()(uint256)")
ANTES_CUENTA=$(cast_call "beneficiaryCount()(uint256)")
echo "   totalAllocated:   $ANTES_TOTAL"
echo "   beneficiaryCount: $ANTES_CUENTA"

# Cuantas direcciones del lote ya tienen saldo. Si son TODAS, este lote ya entro.
YA_CARGADAS=0
while IFS=, read -r dir _; do
  saldo=$(cast_call "allocations(address)(uint256)" "$dir")
  [[ "$saldo" != "0" ]] && (( YA_CARGADAS++ )) || true
done < "$CSV"

if (( YA_CARGADAS == FILAS )); then
  echo
  echo "DETENIDO: las $FILAS direcciones de este lote YA tienen saldo asignado." >&2
  echo "Lo mas probable es que este lote ya se haya cargado y la confirmacion se" >&2
  echo "haya perdido. Volver a enviarlo DUPLICARIA todas las asignaciones." >&2
  echo "Revisa el registro antes de continuar." >&2
  exit 1
fi

if (( YA_CARGADAS > 0 )); then
  echo
  echo "AVISO: $YA_CARGADAS de $FILAS direcciones ya tienen saldo." >&2
  echo "Puede ser correcto (compradores de una fase anterior) o puede ser un envio" >&2
  echo "parcial previo. Verificalo contra el backend antes de seguir." >&2
  read -rp "Continuar de todas formas? (escribi: si) " ok
  [[ "$ok" == "si" ]] || { echo "Cancelado."; exit 1; }
fi

NUEVAS=$(( FILAS - YA_CARGADAS ))

# ------------------------------------------------------------------ 3. enviar
DIRS="[$(cut -d, -f1 "$CSV" | paste -sd,)]"
MONTOS="[$(cut -d, -f2 "$CSV" | paste -sd,)]"

echo "== Enviando el lote"
forge script script/PresaleOps.s.sol:PresaleOps \
  --sig "allocateBatch(address,address[],uint256[])" \
  "$PRESALE_ADDRESS" "$DIRS" "$MONTOS" \
  --rpc-url "$RPC_URL" \
  --account "$KEYSTORE_ACCOUNT" \
  --password-file "$PASSWORD_FILE" \
  --broadcast

# ---------------------------------------------------------------- 4. verificar
echo "== Verificando contra la cadena"
DESPUES_TOTAL=$(cast_call "totalAllocated()(uint256)")
DESPUES_CUENTA=$(cast_call "beneficiaryCount()(uint256)")

DELTA_TOTAL=$(echo "$DESPUES_TOTAL - $ANTES_TOTAL" | bc)
DELTA_CUENTA=$(( DESPUES_CUENTA - ANTES_CUENTA ))

echo "   totalAllocated:   $ANTES_TOTAL -> $DESPUES_TOTAL  (+$DELTA_TOTAL, esperado +$SUMA)"
echo "   beneficiaryCount: $ANTES_CUENTA -> $DESPUES_CUENTA  (+$DELTA_CUENTA, esperado +$NUEVAS)"

FALLO=0
[[ "$DELTA_TOTAL" == "$SUMA" ]]   || { echo "ERROR: el total asignado no coincide." >&2; FALLO=1; }
(( DELTA_CUENTA == NUEVAS ))      || { echo "ERROR: el contador de compradores no coincide." >&2; FALLO=1; }

if (( FALLO )); then
  echo >&2
  echo "NO CONTINUES con el siguiente lote. Revisa que paso antes de enviar nada mas." >&2
  exit 1
fi

echo
echo "OK. Lote $CSV cargado y verificado."
echo "Acumulado: $DESPUES_TOTAL wei en $DESPUES_CUENTA compradores."
