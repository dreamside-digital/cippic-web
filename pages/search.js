import Layout from "@/components/layout/Layout"
import SearchResult from "@/components/elements/SearchResult"
import Fade from 'react-reveal/Fade';
import getLayoutData from "@/utils/layout-data"
import { useState } from 'react'

const qs = require('qs');

const searchArticles = async ({ locale, term }) => {
  try {
    const searchQuery = qs.stringify(
        {
          locale: locale,
          _q: term,
          fields: [
            'title',
            'author',
            'preview',
            'date_published',
            'slug',
          ],
          populate: {
            categories: {
              populate: ['name', 'slug']
            },
            'content_types': {
              populate: ['name', 'slug']
            }
          },
          pagination: {
            limit: 50,
            start: 0
          }
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
      
      const url = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${searchQuery}`
      const searchRes = await fetch(url)
      const { data } = await searchRes.json()

      const articles = data.map(article => {
        const categories = article.attributes.categories?.data || []
        const formattedCategories = categories.map(c => ({id: c.id, ...c.attributes}))
        const content_types = article.attributes.content_types?.data || []
        const formattedContentTypes = content_types.map(c => ({id: c.id, ...c.attributes}))
        const item = {
          ...article.attributes,
          id: article.id,
          categories: formattedCategories,
          content_types: formattedContentTypes,
          link: `/${locale}/articles/${article.attributes.slug}`
        }
        return item
      })
      
      return articles 
  } catch(e) {
    console.log(e)
    return []
  }
}

const searchPages = async ({ locale, term, label="Page" }) => {
  try {
    const searchQuery = qs.stringify(
        {
          locale: locale,
          _q: term,
          fields: [
            'title',
            'slug',
            'subtitle'
          ],
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
      
      const url = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/pages?${searchQuery}`
      const searchRes = await fetch(url)
      const { data } = await searchRes.json()
      
      const pages = data.map(page => {
        const item = {
          title: page.attributes.title,
          preview: page.attributes.subtitle,
          categories: [{name: label}],
          content_types: [],
          link: `/${locale}/${page.attributes.slug}`,
        }
        return item
      })

      return pages
  } catch(e) {
    console.log(e)
    return []
  }
}

const searchCategories = async ({ locale, term, label }) => {
  try {
    const searchQuery = qs.stringify(
        {
          locale: locale,
          _q: term,
          fields: [
            'name',
            'slug',
            'description'
          ],
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
      
      const url = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/categories?${searchQuery}`
      const searchRes = await fetch(url)
      const { data } = await searchRes.json()
      
      const categories = data.map(category => {
        const item = {
          title: category.attributes.name,
          preview: category.attributes.description,
          categories: [{ name: label }],
          content_types: [],
          link: `/${locale}/issues/${category.attributes.slug}`
        }
        return item
      })

      return categories
  } catch(e) {
    console.log(e)
    return []
  }
}

const searchContentTypes = async ({ locale, term, label }) => {
  try {
    const searchQuery = qs.stringify(
        {
          locale: locale,
          _q: term,
          fields: [
            'name',
            'slug',
            'description'
          ],
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
      
      const url = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/content-types?${searchQuery}`
      const searchRes = await fetch(url)
      const { data } = await searchRes.json()
      
      const contentTypes = data.map(content_type => {
        const item = {
          title: content_type.attributes.name,
          preview: content_type.attributes.description,
          categories: [{ name: label }],
          content_types: [],
          link: `/${locale}/our-work/${content_type.attributes.slug}`
        }
        return item
      })

      return contentTypes
  } catch(e) {
    console.log(e)
    return []
  }
}


export const getServerSideProps = async ({ locale, query }) => {
    const layout = await getLayoutData(locale)
    const terms = layout.translation
    const { term } = query;
    const pages = await searchPages({ locale, term, label: terms.page })
    const categories = await searchCategories({ locale, term, label: terms.issues })
    const contentTypes = await searchContentTypes({ locale, term, label: terms.our_work })
    const articles = await searchArticles({ locale, term })

    const content = { searchResults: [...pages, ...categories, ...contentTypes, ...articles] }

    return { 
      props: { content, layout, term }
    }
}

export default function Search({content, layout, term}) {
  const { searchResults } = content
  const terms = layout.translation

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
                              searchResults.length > 0 && (
                              searchResults.map(article => {
          
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
                              searchResults.length === 0 && (<p>{terms.no_search_results}</p>)
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