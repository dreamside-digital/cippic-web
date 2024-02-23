import Layout from "@/components/layout/Layout"
import Header from "@/components/sections/Header"
import ArticleCard from "@/components/elements/ArticleCard"
import dynamic from 'next/dynamic';
import Fade from 'react-reveal/Fade';
import getLayoutData from "@/utils/layout-data"
import { useRouter } from 'next/router'
import { REVALIDATE_SECONDS } from '@/utils/constants'
import { useContext } from 'react'
import { TranslationContext } from '@/contexts/TranslationContext'

const FilterContent = dynamic(() => import('@/components/elements/FilterContent'), {
    ssr: false,
})

const qs = require('qs');

async function fetchAllArticles(articles, pagination, locale, slug) {
  try {
    const query = qs.stringify(
        {
            locale: locale,
            fields: ['title', 'preview', 'slug', 'date_published'],
            populate: [
                'main_image',
                'categories',
                'content_types'
            ],
            filters: {
                content_types: {
                    slug: {
                        $eq: slug
                    }
                },
            },
            sort: ["date_published:desc", "title"],
          pagination: {
            page: pagination.page + 1,
            pageSize: 100
          },
          publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${query}`)
    const { data, meta } = await res.json()
    const newArticles = data.map(t => ({ id: t.id, ...t.attributes}))
    const accumulator = articles.concat(newArticles)

    if (meta.pagination.page < meta.pagination.pageCount) {
      return await fetchAllArticles(accumulator, meta.pagination, locale, slug)
    } else {
      return accumulator
    }
  } catch (e) {
    console.log(e)
    return []
  }
}

const fetchArticles = async ({ pagination, locale, slug, filters=[] }) => {
    const articlesQuery = qs.stringify(
      {
        locale,
        pagination: pagination,
        fields: ['title', 'preview', 'slug', 'date_published'],
        sort: "date_published:desc",
        populate: [
            'main_image',
            'categories',
            'content_types'
        ],
        filters: {
            content_types: {
                slug: {
                    $eq: slug
                }
            },
            categories: {
                slug: {
                    $in: filters
                }
            }
        },
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live',
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const articlesRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${articlesQuery}`)
    const articlesJson = await articlesRes.json()
    const articles = articlesJson.data.map(t => ({ id: t.id, ...t.attributes}))

    return { articles, pagination: articlesJson.meta.pagination }
}

export async function getStaticPaths({locale}) {
    if (process.env.NEXT_PUBLIC_PREVIEW_MODE) {
        return {
          paths: [],
          fallback: 'blocking',
        }
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/content-types?locale=all`)
    const { data, meta } = await res.json()
    const paths = data.map((cat) => ({
        params: { slug: cat.attributes.slug },
        locale: cat.attributes.locale
    }))

    // We'll pre-render only these paths at build time.
    // { fallback: false } means other routes should 404.
    return { paths, fallback: false }
}

export const getStaticProps = async ({ params, locale }) => {
    const layout = await getLayoutData(locale)
    const { slug } = params;

    const contentTypeQuery = qs.stringify(
      {
        locale,
        filters: {
            slug: {
              $eq: slug,
            },
        },
        populate: ['localizations'],
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const contentTypeRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/content-types?${contentTypeQuery}`)
    const contentTypeJson = await contentTypeRes.json()
    const contentTypeData = contentTypeJson.data[0]

    if (!contentTypeData) {
        return {
          redirect: {
            destination: "/",
          },
        }
    }

    const contentType = { id: contentTypeData.id, ...contentTypeData.attributes }

    const allArticles = await fetchAllArticles([], {page: 0}, locale, slug)

    const articleFilters = allArticles.reduce((filters, article) => {
        const articleContentTypes = article.categories.data.map(ct => ({ id: ct.id, ...ct.attributes}))
        const newFilters = articleContentTypes.map(act => {
            const filterExists = filters.find(f => f?.slug === act.slug)
            if (!filterExists) {
                return act
            }
        }).filter(i => i)
        return filters.concat(newFilters)
    }, [])

    const articleCounts = articleFilters.reduce((counts, f) => {
        const articlesWithFilterField = allArticles.filter(article => {
            const articleFilterFieldIds = article.categories.data.map(f => f.attributes.slug)
            return articleFilterFieldIds.includes(f.slug)
        })

        counts[f.slug] = articlesWithFilterField.length
        return counts
    }, {})

    const latestArticles = allArticles.slice(0,3)

    const content = { contentType, latestArticles, articleFilters, articleCounts, total: allArticles.length, slug }

    return { 
        props: { content, layout },
        revalidate: process.env.NEXT_PUBLIC_PREVIEW_MODE ? REVALIDATE_SECONDS : false 
    }
}

export default function OurWork({ content, layout }) {
    const { contentType, latestArticles, articleFilters, articleCounts, total, slug } = content;
    const { locale } = useRouter()
    const terms = layout.translation

    let localizations;
    if (contentType.localizations?.data && contentType.localizations?.data.length > 0) {
      localizations = contentType.localizations.data.map(l => {
        return ({
          ...l.attributes,
          link: `${l.attributes.locale}/our-work/${l.attributes.slug}`
        })
      })
    }

    let seo = {
      title: contentType.name,
      description: contentType.description,
      type: "website",
    }

    if (contentType.SEO) {
      seo = { ...seo, ...contentType.SEO }
    }

    const fetchArticlesWithSlug = async(params) => {
        return await fetchArticles({...params, slug: slug})
    }

    return (
        <>
            <Layout {...layout} localizations={localizations} seo={seo} title={contentType.name}>
            <Header>
                <div className="title-section ">
                    <h1 className="mt-0 underline">{contentType.name}</h1>
                    <h2 className="title-small">{terms.latest}</h2>
                </div>
                            
                <div className="row header-articles">
                {
                        latestArticles.map((article, index) => {
                            return (
                                <div key={article.id} className="article">
                                    <ArticleCard 
                                        article={article} 
                                        showDate
                                        showImage
                                        imageTop
                                        showTags
                                        order={index}
                                    />
                                </div>
                            )
                        })
                    }
                    
                </div>
            </Header>
            <main id="main" className="site-main" role="main">
                <section className="section-md">
                    <div className="container">
                        <div className="row">
                            <div className="project_all filt_style_one filter_enabled">
                                <FilterContent 
                                    initialArticles={[]} 
                                    filters={articleFilters} 
                                    articleCounts={articleCounts}
                                    filterField="categories" 
                                    fetchArticles={fetchArticlesWithSlug}
                                    locale={locale}
                                    count={total}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            </Layout>
        </>
    )
}
