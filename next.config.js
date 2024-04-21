/** @type {import('next').NextConfig} */

const REDIRECTS = [
  {
    source: "/en/alltitles/FAQs/all",
    destination: "/our-work/fa-qs",
    locale: false,
    permanent: true
  },
  {
    source: "/fr/alltitles/FAQs/all",
    destination: "/fr/our-work/faq",
    locale: false,
    permanent: true
  },
  {
    source: "/en/all/news/all",
    destination: "/our-work/news",
    locale: false,
    permanent: true
  },
  {
    source: "/fr/all/news/all",
    destination: "/fr/our-work/nouvelles",
    locale: false,
    permanent: true
  },
  {
    source: "/en/privacy_policy",
    destination: "/privacy",
    locale: false,
    permanent: true
  },
  {
    source: "/en/copyright",
    destination: "/issues/copyright",
    locale: false,
    permanent: true
  },
  {
    source: "/en/privacy",
    destination: "/issues/privacy",
    locale: false,
    permanent: true
  },
  {
    source: "/en/telecom",
    destination: "/issues/communications",
    locale: false,
    permanent: true
  },
  {
    source: "/en/electronic_surveillance",
    destination: "/issues/electronic-surveillance",
    locale: false,
    permanent: true
  },
  {
    source: "/en/open_governance",
    destination: "/issues/open-information",
    locale: false,
    permanent: true
  },
  {
    source: "/en/expression",
    destination: "/issues/digital-expression",
    locale: false,
    permanent: true
  },
  {
    source: "/en/consumer_protection",
    destination: "/issues/consumer-protection",
    locale: false,
    permanent: true
  },
  {
    source: "/fr/droit_dauteur",
    destination: "/fr/issues/droit-d-auteur",
    locale: false,
    permanent: true
  },
  {
    source: "/fr/vie_privee",
    destination: "/fr/issues/vie-privee",
    locale: false,
    permanent: true
  },
  {
    source: "/fr/node/129330",
    destination: "/fr/issues/communications-1",
    locale: false,
    permanent: true
  },
  {
    source: "/fr/surveillance_electronique",
    destination: "/fr/issues/surveillance-electronique",
    locale: false,
    permanent: true
  },
  {
    source: "/sites/default/files/:filepath*",
    destination: `${process.env.ARCHIVED_SITE_DOMAIN}/sites/default/files/:filepath*`,
    permanent: true
  },
  {
    source: "/uploads/:filepath*",
    destination: `${process.env.ARCHIVED_SITE_DOMAIN}/uploads/:filepath*`,
    permanent: true
  }
]

const qs = require('qs');

async function fetchAllArticles(articles, pagination) {
  try {
    const query = qs.stringify(
        {
          locale: "all",
          populate: "archive_path, slug, locale",
          pagination: {
            page: pagination.page + 1,
            pageSize: 100
          }
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${query}`)
    const { data, meta } = await res.json()
    const accumulator = articles.concat(data)

    if (meta.pagination.page < meta.pagination.pageCount) {
      return await fetchAllArticles(accumulator, meta.pagination)
    } else {
      return accumulator
    }
  } catch (e) {
    console.log(e)
    return []
  }
}

async function generateRedirects() {
  const articleData = await fetchAllArticles([], {page: 0})

  const redirects = articleData.map((article) => {
    if (article?.attributes?.archive_path && article?.attributes?.slug) {
      return {
        source: article.attributes.archive_path,
        destination: `${article.attributes.locale === "fr" ? "/fr" : ""}/articles/${article.attributes.slug}`,
        permanent: true,
        locale: false,
      }
    }
  }).filter(r => r)

  return redirects
}


const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'fr'],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: 'en',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms.cippic.ca',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  async redirects() {
    const cmsRedirects = await generateRedirects()
    return cmsRedirects.concat(REDIRECTS)
  }
}

module.exports = nextConfig
