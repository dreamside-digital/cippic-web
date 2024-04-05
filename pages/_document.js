import { Head, Html, Main, NextScript } from 'next/document'
export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="robots" content={`${process.env.NEXT_PUBLIC_PREVIEW_MODE ? "noindex, nofollow" : 'index, follow'}`} />
            </Head>
            <link rel="shortcut icon" href="/favicon.svg" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz@9..40&family=Inter:wght@400;600&family=Playfair+Display&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <script src="https://kit.fontawesome.com/231142308d.js" crossOrigin="anonymous"></script>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
