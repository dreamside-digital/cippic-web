import Layout from "@/components/layout/Layout"
import SearchResult from "@/components/elements/SearchResult"
import Fade from 'react-reveal/Fade';
import getLayoutData from "@/utils/layout-data"
import { useState } from 'react'

const qs = require('qs');


export const getServerSideProps = async ({ locale, query }) => {
    const layout = await getLayoutData(locale)
    const { term } = query;
    const searchQuery = qs.stringify(
      {
        locale: locale,
        query: term,
        filters: {
          articles: {
            publishedAt: {
              $notNull: true
            }
          },
          categories: {
            publishedAt: {
              $notNull: true
            }
          },
          'content-types': {
            publishedAt: {
              $notNull: true
            }
          }
        },
        populate: {
          articles: {
            categories: {
              populate: ['name', 'slug']
            },
            'content_types': {
              populate: ['name', 'slug']
            }
          }
        }
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );
    
    const url = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/fuzzy-search/search?${searchQuery}`
    const searchRes = await fetch(url)
    const searchJson = await searchRes.json()

    const content = { searchResults: searchJson }

    return { 
      props: { content, layout, term }
    }
}

export default function Search({content, layout, term}) {
  const { searchResults } = content
  const terms = layout.translation

  const pages = searchResults.pages.map(page => {
    const item = {
      ...page,
      link: `${page.slug}`,
      preview: page.subtitle,
      categories: [{name: 'Page'}]
    }
    return item
  })

  const articles = searchResults.articles.map(article => {
    const item = {
      ...article,
      link: `/articles/${article.slug}`
    }
    return item
  })

  const categories = searchResults.categories.map(category => {
    const item = {
      title: category.name,
      preview: category.description,
      categories: [{ name: 'Issue' }],
      link: `/issues/${category.slug}`
    }
    return item
  })

  const contentTypes = searchResults['content-types'].map(content_type => {
    const item = {
      title: content_type.name,
      preview: content_type.description,
      categories: [{ name: 'Our work' }],
      link: `/our-work/${content_type.slug}`
    }
    return item
  })

  const results = [...pages, ...categories, ...contentTypes, ...articles]
  const title = `${terms.search_results} "${term}"`

    return (
        <>
          <Layout {...layout} title={title}> 
            <main id="main" className="site-main" role="main">
            <section className="section-md">
              <div className="container">
                <div className="row">
                  <div className="col-12">
                    <h1 className="mb-5">{title}</h1>
                      <div className="d-flex flex-column gap-4">
                          {
                              results.length > 0 && (
                              results.map(article => {
                                  return (
                                    <Fade key={article.id}>
                                      <SearchResult 
                                          article={article} 
                                          showImage
                                          imageLeft
                                          showTeaser
                                          showDate
                                          bgLight
                                          showTags
                                      />
                                    </Fade>
                                  )
                              }))
                          }
                          {
                              results.length === 0 && (<p>{terms.no_search_results}</p>)
                          }
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            </main>
          </Layout>
        </>
    )
}