import Layout from "@/components/layout/Layout"
import Link from "next/link"
import Image from "next/image"
import dynamic from 'next/dynamic'
import getLayoutData from "@/utils/layout-data"
import Fade from 'react-reveal/Fade';
import ArticleCard from "@/components/elements/ArticleCard"
import Header from "@/components/sections/Header"
import { useState } from 'react'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import Lightbox from "yet-another-react-lightbox"
import Captions from "yet-another-react-lightbox/plugins/captions"
import { REVALIDATE_SECONDS } from '@/utils/constants'


import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";


const dynamicContentDict = {
  "common.faq-section": dynamic(() => import('@/components/sections/FaqSection')),
  "common.highlight-section": dynamic(() => import('@/components/sections/HighlightBox')),
  "common.image-slider": dynamic(() => import('@/components/sections/ImageSliderSection')),
  "common.paragraph-text-section": dynamic(() => import('@/components/sections/RichTextSection')),
  "common.page-section-navigation": dynamic(() => import('@/components/sections/PageNavigation')),
  "common.team-section": dynamic(() => import('@/components/sections/TeamSection')),
  "common.text-with-image-lightbox": dynamic(() => import('@/components/sections/TextWithImages')),
  "common.contact-options": dynamic(() => import('@/components/sections/ContactOptions'))
}

const qs = require('qs');

async function fetchAllArticles(articles, pagination) {
  try {
    const query = qs.stringify(
        {
          locale: "all",
          populate: "*",
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

export async function getStaticPaths({ locales }) {
  // Call an external API endpoint to get posts  

  if (process.env.NEXT_PUBLIC_PREVIEW_MODE) {
    return {
      paths: [],
      fallback: 'blocking',
    }
  }

  const allArticles = await fetchAllArticles([], {page: 0})

  const paths = allArticles.map((article) => {
    return { params: { slug: article.attributes.slug }, locale: article.attributes.locale }
  })
 
  return { paths, fallback: false }
}

export const getStaticProps = async ({ params, locale }) => {
    const { slug } = params;
    const layout = await getLayoutData(locale)

    const pageQuery = qs.stringify(
      {
        locale: locale,
        filters: {
            slug: {
              $eq: slug,
            },
        },
        populate: {
          main_image: true,
          more_images: true,
          categories: true,
          content_types: true,
          dynamic_content: {
            on: {
              'common.faq-section': { populate: '*' },
              'common.paragraph-text-section': { populate: '*' },
              'common.highlight-section': { populate: '*' },
              'common.image-slider': { populate: '*' },
            }
          },
          localizations: true,
          SEO: {
            populate: ['share_image']
          }
        },
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );


    const articleRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${pageQuery}`)
    const articleJson = await articleRes.json()
    const articleData = articleJson.data[0]

    if (!articleData) {
      return {
        notFound: true,
      }
    }

    const article = { id: articleData.id, ...articleData.attributes }
    const categoriesArr = article.categories.data.map(c => c.attributes.slug)

    const relatedArticlesQuery = qs.stringify(
      {
        filters: {
          $and: [
            {
              categories: {
                slug: {
                  $in: categoriesArr
                }
              }
            },
            {
              slug: {
                $ne: slug
              }
            },
          ]
        },
        sort: "date_published:desc",
        pagination: {
          start: 0,
          limit: 3
        },
        populate: [
          'main_image',
          'categories',
          'content_types'
        ],
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const relatedArticlesRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${relatedArticlesQuery}`)
    const relatedArticlesJson = await relatedArticlesRes.json()
    const relatedArticles = relatedArticlesJson.data.map(r => r.attributes)

    const content = { article, relatedArticles }

    return { 
      props: { content, layout },
      revalidate: process.env.NEXT_PUBLIC_PREVIEW_MODE ? REVALIDATE_SECONDS : false
    }
}

export default function ArticlePage({ content, layout }) {
    const { article, relatedArticles } = content;
    const [openLightbox, setOpenLightbox] = useState(false);
    const { locale } = useRouter()
    const categories = article.categories.data || []
    const content_types = article.content_types.data || []
    const terms = layout.translation

    let lightboxImages = [];
    let mainImage;
    let moreImages = [];

    if (article.main_image?.data?.attributes) {
      let sizedImage = article.main_image.data.attributes

      if (article.main_image.data.attributes.formats?.small) {
        sizedImage = article.main_image.data.attributes.formats.small
      }

      if (article.main_image.data.attributes.formats?.medium) {
        sizedImage = article.main_image.data.attributes.formats.medium
      }

      mainImage = {
        ...article.main_image.data.attributes,
        thumbnail: sizedImage,
        src: `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${article.main_image.data.attributes.url}`, 
        alt: article.main_image.data.attributes.alternativeText,
        description: article.main_image.data.attributes.caption
      }
      lightboxImages = lightboxImages.concat(mainImage)
    }

    if (article.more_images?.data) {
      moreImages = article.more_images.data.map(img => { 
        let sizedImage = img.attributes

        if (img.attributes.formats?.small) {
          sizedImage = img.attributes.formats.small
        }

        if (img.attributes.formats?.medium) {
          sizedImage = img.attributes.formats.medium
        }

        return {
          ...img.attributes,
          thumbnail: sizedImage,
          src: `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${img.attributes.url}`, 
          alt: img.attributes.alternativeText,
          description: img.attributes.caption
        }
      })
      lightboxImages = lightboxImages.concat(moreImages)
    }
    
    const datePublished = new Date(article.date_published)
    const dateLocale = locale === "fr" ? 'fr-CA' : 'en-CA'
    const dateString = datePublished.toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })
    const tags = categories.map(cat => cat.attributes.name).concat(content_types.map(ct => ct.attributes.name))

    let localizations;
    if (article.localizations?.data && article.localizations?.data.length > 0) {
      localizations = article.localizations.data.map(l => {
        return ({
          ...l.attributes,
          link: `${l.attributes.locale}/articles/${l.attributes.slug}`
        })
      })
    }

    let seo = {
      title: article.title,
      description: article.preview,
      type: "article",
    }

    if (mainImage) {
      seo.image = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${mainImage.url}`
    }

    if (article.SEO) {
      seo = { ...seo, ...article.SEO }
    }

    const dynamicSections = article.dynamic_content.map((section, index) => {
      const DynamicComponent = dynamicContentDict[section.__component];
      if (!DynamicComponent) return null

      return {
        component: DynamicComponent,
        props: section
      }
    })

    return (
        <>
            <Layout 
              {...layout} 
              localizations={localizations}
              seo={seo}
              title={article.title}
            >
              <main id="main" className="site-main" role="main">
                <Header>
                  <div className="title_sections">
                    <h1 className="title-md mb-4">{article.title}</h1>
                  </div>
                  { article.preview && <p className="text-lg mb-4">{article.preview}</p> }
                  <p className="byline">
                  { article.date_published && <span className="byline">{`${terms.published} ${dateString}`}</span> }
                  { article.author && <span className="byline">{`${terms.by} ${article.author}`}</span> }
                  </p>
                </Header>

                <section className="section-default">
                    <div className="container">
                        <div className="row">
                          { mainImage &&
                            <div className="col-12 col-md-4 mx-auto order-md-2 mr_bottom_20">
                              <button aria-label="toggle image viewer" onClick={() => setOpenLightbox(true)} className="btn btn-clear p-0">
                              <Image 
                                  width={mainImage.thumbnail.width} 
                                  height={mainImage.thumbnail.height} 
                                  src={`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${mainImage.thumbnail.url}`}
                                  alt={mainImage.alternativeText} 
                                  className="mr_bottom_10 img-fluid img-full highlight-shadow" 
                              />
                              <p className="text-sm mr_bottom_10">{mainImage.caption}</p>
                              <div className="thumbnails">
                              {
                                moreImages.map(img => {
                                  return (<Image 
                                      key={img.thumbnail.url}
                                      width={40} 
                                      height={40} 
                                      src={`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${img.thumbnail.url}`}
                                      alt={img.alternativeText} 
                                      className="img-fluid img-full" 
                                  />)
                                })
                              }
                              </div>
                              </button>
                              <Lightbox
                                plugins={[Captions]}
                                open={openLightbox}
                                close={() => setOpenLightbox(false)}
                                slides={lightboxImages}
                              />
                            </div>
                          }
                            <div className={`col-12 ${mainImage ? 'col-md-8' : ''} order-md-1`}>
                                <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                    {article.body}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </section>

                {dynamicSections.map((section, index) => {
                  const DynamicComponent = section.component
                  return <DynamicComponent {...section.props} key={`dynamic-component-${index}`} />
                })}

                <section className="section-md bg-white">
                    <div className="container">
                        <div className="row">
                          <div className="col-12">
                            <div className="title-small tags-links m-0">
                              {`${terms.tags}:`}
                              {
                                categories.map(tag => {
                                  return <Link key={tag.attributes.slug} href={`/issues/${tag.attributes.slug}`} className="tag btn btn-simple">{tag.attributes.name}</Link>
                                })
                              }
                              {
                                content_types.map(tag => {
                                  return <Link key={tag.attributes.slug} href={`/our-work/${tag.attributes.slug}`} className="tag btn btn-simple">{tag.attributes.name}</Link>
                                })
                              }
                            </div>
                          </div>
                        </div>
                    </div>
                </section>

                { (relatedArticles.length > 0) && 
                  <section className="section-default bg-two">
                      <div className="container">
                          <div className="row">
                            <div className="col-12 title-section">
                              <h2 className="title-small">{terms.related_articles}</h2>
                            </div>
                          </div>
                          <div className="row news-articles">
                          {
                            relatedArticles.map((article, index) => {
                                return (
                                    <div key={article.slug} className="col-12 col-lg-4">
                                        <Fade bottom delay={index * 60}>
                                            <ArticleCard 
                                              article={article} 
                                              tagsAttribute="content_types" 
                                              showImage
                                              imageTop
                                              showTags
                                            />
                                        </Fade>
                                    </div>
                                )
                            })
                          }
                        </div>
                      </div>
                  </section>
                }

              </main>
            </Layout>
        </>
    )
}
