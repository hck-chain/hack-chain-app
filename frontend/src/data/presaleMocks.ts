import type { Contributor, FaqEntry } from "@/types/presale";

/* ============================================================
   MOCK — reemplazar por el servicio de consulta de Julian (M-09)
   cuando el contrato de datos esté acordado.
   ============================================================ */

export const MOCK_CONTRIBUTORS: Contributor[] = [
  { address: "0x4799Ce543178661405Cb7927a9Ec008D850A5215", phase: "Primera", usdt: 30, hack: 1_000_000 },
  { address: "0xC97d2a444eeA61936eE9F79c5010dBc138ad4076", phase: "Segunda", usdt: 50, hack: 1_000_000 },
  { address: "0xbEC1B3A74fE010220DFeFC1EA59Dd489490b38B4", phase: "Tercera", usdt: 80, hack: 1_000_000 },
];

export const FAQ_ITEMS: FaqEntry[] = [
  {
    q: "¿Qué estoy comprando exactamente? ¿Es como una acción de una empresa?",
    a: "HACK es el token nativo de HackChain. Piénsalo como los tickets de un parque de diversiones: sirven para usar cosas dentro de ese parque. Sirven para realizar pagos, generar más tokens HACK y acceder a incentivos por logros dentro de la plataforma. No es una acción de bolsa: no da un pedazo de la empresa ni pagos periódicos. Su precio sube o baja según cuánta gente quiera comprarlo.",
  },
  {
    q: "¿Puedo comprar tokens HACK con tarjeta o transferencia del banco?",
    a: "Aquí no. La compra se hace con USDT, un token que siempre vale un dólar. Conseguir USDT es más fácil de lo que suena, y se puede hacer con tarjeta (ver guía más abajo).",
  },
  {
    q: "¿Qué es una cartera digital y por qué la necesito?",
    a: "Es una app que se instala en el celular, como la app de tu banco, pero para tokens. Ahí llegan tus tokens HACK. No se guardan en un banco: solo vos tenés acceso. Cuando crees tu cartera, va a mostrarte 12 palabras — anotalas en papel y guardalas donde solo vos sepas. Son la llave maestra: si alguien las consigue, se lleva todo; si las perdés, nadie te las puede devolver. Nunca las escribas en una página web ni se las des a nadie, ni siquiera a alguien que diga representarnos.",
  },
  {
    q: "¿Cómo consigo USDT en mi cartera digital?",
    a: "Instalá MetaMask, creá tu cuenta, entrá a \"Buy\"/\"Comprar\", buscá \"USDT\", elegí la red Ethereum y el token \"USDT\" o \"Tether USDT\", indicá el monto y completá el pago. Los USDT quedan disponibles en la sección \"Tokens\" para comprar tus HACK.",
  },
  {
    q: "¿Es seguro conectar mi cartera digital? ¿Pueden robarme los tokens?",
    a: "Sí, es seguro. Conectar tu cartera es como mostrar el número de tu cuenta: alguien puede ver que existe y pedirte un pago, pero no puede sacarte nada. Ningún token sale sin que vos presiones \"Confirmar\", y antes de eso MetaMask te muestra exactamente cuánto y a dónde. Dos reglas para estar a salvo siempre: nunca compartas tus 12 palabras, y verificá que la dirección del sitio sea exactamente www.hackchain.app.",
  },
  {
    q: "Ya pagué por mis tokens HACK y no veo nada en mi cartera. ¿Perdí mi dinero?",
    a: "No. Los tokens no se envían al instante: se reclaman al finalizar la preventa. Tu aporte queda registrado y podés verlo en la sección de contribuidores de esta misma página. Cuando termine la preventa, volvé, conectá tu cartera y seleccioná \"Reclamar HACK\".",
  },
  {
    q: "¿Cuándo puedo utilizar mis tokens HACK en HackChain?",
    a: "Hoy podés usarlos para pagar a educadores por clases personalizadas. A medida que se habiliten más funciones que los requieran, lo vamos a avisar en nuestras redes sociales.",
  },
  {
    q: "¿Puedo perderlo todo?",
    a: "Sí. Comprar un token en fase inicial implica riesgo real de perder el 100%: el token puede llegar a valer nada. No prometemos ninguna ganancia y nada de esto es asesoramiento financiero. Invertí solo dinero que puedas permitirte perder por completo.",
  },
];
