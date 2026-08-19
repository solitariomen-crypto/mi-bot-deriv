# 🤖 Mi Bot Deriv - Acumulador Automático Volatilidad 10

Bot de trading automático para Deriv que opera en el mercado **Acumulador (ACCU)** con **Volatilidad 10 (1s)**.

## 📋 Características

- ✅ **100% Automático** - Opera sin intervención manual
- ✅ **Interfaz Web** - Se ejecuta en el navegador (index.html)
- ✅ **Portable** - Todos los archivos en una carpeta, copiable a USB
- ✅ **API Oficial Deriv** - Usa WebSocket API v1 con App ID 67545
- ✅ **Gestión de Riesgo** - Take profit automático por operación
- ✅ **Meta Configurable** - Se detiene al alcanzar ganancia total objetivo
- ✅ **Demo/Real** - Cambia entre cuenta demo y real fácilmente
- ✅ **Logs Persistentes** - Historial guardado en localStorage

## ⚙️ Parámetros por Defecto

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Capital por operación** | $1 USD | Stake fijo en cada trade |
| **Take Profit por operación** | $2 USD | Cierra automáticamente al ganar $2 |
| **Tasa de crecimiento** | 2% | Growth rate del acumulador |
| **Meta total ganancias** | $20 USD | Bot se detiene al acumular $20 |
| **Mercado** | R_10 | Volatilidad 10 (1s) |
| **Tipo contrato** | ACCU | Acumulador |

## 🚀 Instalación y Uso

### 1. Obtener Token API (PAT) de Deriv
1. Inicia sesión en [Deriv](https://deriv.com)
2. Ve a **Configuración** → **API Tokens**
3. Crea un nuevo token con permisos: **Read**, **Trade**, **Cashier**
4. Copia el token generado

### 2. Ejecutar el Bot
**Opción A - Doble clic (Windows):**
- Ejecuta `iniciar_bot.bat` - Abre automáticamente en tu navegador

**Opción B - Manual:**
- Abre `index.html` en cualquier navegador moderno (Chrome, Edge, Firefox)

### 3. Configurar y Conectar
1. Pega tu **API Token** en el campo correspondiente
2. Selecciona **Demo** (recomendado para probar) o **Real**
3. Ajusta parámetros si deseas (opcional)
4. Click en **"Conectar"**
5. Click en **"Iniciar Bot"**

## 📁 Estructura de Archivos

```
mi bot/
├── index.html          # Interfaz web principal
├── bot.js              # Lógica del bot (WebSocket API)
├── config.json         # Configuración por defecto
├── iniciar_bot.bat     # Lanzador para Windows
├── README.md           # Este archivo
└── LICENSE             # Licencia MIT
```

## 🔧 Configuración Avanzada

Edita `config.json` para cambiar valores por defecto:
```json
{
  "stakeAmount": 1,
  "takeProfit": 2,
  "growthRate": 2,
  "totalTarget": 20,
  "symbol": "R_10",
  "contractType": "ACCU"
}
```

## 📊 Cómo Funciona

1. **Conexión** → WebSocket a Deriv API (Demo/Real)
2. **Autorización** → Token PAT + App ID 67545
3. **Propuesta** → Solicita precio para contrato ACCU con growth rate 2%
4. **Compra** → Ejecuta compra de $1 stake
5. **Monitoreo** → Rastrea payout en tiempo real via `proposal_open_contract`
6. **Take Profit** → Vende automáticamente cuando ganancia ≥ $2
7. **Repetición** → Repite hasta acumular $20 ganancia total
8. **Parada** → Se detiene solo al alcanzar meta

## ⚠️ Advertencias Importantes

- **Empieza SIEMPRE en Demo** - Prueba la estrategia sin riesgo
- **Volatilidad 10** - Mercado sintético 24/7, pero puede tener spreads variables
- **Acumulador (ACCU)** - Requiere que el precio se mantenga en rango; riesgo de pérdida total del stake
- **Growth Rate 2%** - Conservative; mayor % = mayor riesgo/retorno
- **No es asesoría financiera** - Úsalo bajo tu propia responsabilidad
- **Past performance ≠ future results**

## 🛠️ Requisitos Técnicos

- Navegador moderno con soporte WebSocket (Chrome 50+, Firefox 45+, Edge 79+)
- Conexión a internet estable
- Cuenta Deriv con API Token válido
- HTTPS requerido para WebSocket seguro (wss://)

## 📝 Logs y Depuración

- Logs en tiempo real en la interfaz
- Persistencia en localStorage (sobrevive a recargas)
- Botón "Exportar Logs" para guardar como .txt
- Consola del navegador (F12) para debug avanzado

## 🔄 Portabilidad (USB / Otra PC)

1. Copia toda la carpeta `mi bot` a tu USB
2. En la otra PC, ejecuta `iniciar_bot.bat` o abre `index.html`
3. La configuración y logs se guardan en el navegador (localStorage)
4. Para migrar config: Exporta/Importa `config.json` manualmente

## 📞 Soporte

- [Documentación API Deriv](https://developers.deriv.com/docs/)
- [Comunidad Deriv](https://community.deriv.com/)
- [Deriv API Playground](https://developers.deriv.com/playground/)

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

**¡Trading automatizado responsable! 📈**