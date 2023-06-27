import { Head, Html, Main, NextScript } from 'next/document'
export default function Document() {
    return (
        <Html lang="en">
            <Head />
            <link rel="shortcut icon" href="/logomark.svg" />
            <link rel="preconnect" href="https://fonts.bunny.net" />
            <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
            <link
                href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700,800,900|family=dm-sans:400,400i,500,500i,700,700i"
                rel="stylesheet"
            />
            <body className="theme-creote">
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
