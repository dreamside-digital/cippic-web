import Layout from "@/components/layout/Layout"
import ButtonLink from "@/components/elements/ButtonLink"
import Link from "next/link"
import Image from "next/image"
import dynamic from 'next/dynamic'
import { Head } from 'next/document'
import getLayoutData from "@/utils/layout-data"
import Fade from 'react-reveal/Fade';
import Header from "@/components/sections/Header"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import rehypeExternalLinks from 'rehype-external-links'
import { REVALIDATE_SECONDS } from '@/utils/constants'
import { BlocksRenderer } from '@strapi/blocks-react-renderer';
import { Form } from "@quillforms/renderer-core";
import "@quillforms/renderer-core/build-style/style.css";
import { registerCoreBlocks } from "@quillforms/react-renderer-utils";
import { nanoid } from 'nanoid'
import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
} from 'react-accessible-accordion';

registerCoreBlocks()

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

async function fetchQuizzes() {
  try {
    const query = qs.stringify(
        {
          locale: "all",
          populate: "*",
          publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/quiz?${query}`)
    const { data, meta } = await res.json()
    return data || []
  } catch (e) {
    console.log(e)
    return []
  }
}

export async function getStaticPaths({ locales }) {

  if (process.env.NEXT_PUBLIC_PREVIEW_MODE) {
    return {
      paths: [],
      fallback: 'blocking',
    }
  }

  const quizzes = await fetchQuizzes()

  const paths = quizzes.map((quiz) => {
    // return { params: { slug: quiz.attributes.slug }, locale: quiz.attributes.locale }
    return { params: { slug: quiz.attributes.slug }, locale: quiz.attributes.locale }
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
          questions: {
            on: {
              'quiz.multiple-choice': { populate: '*' },
              'quiz.true-false': { populate: '*' },
            }
          },
          results: true,
          localizations: true,
          // SEO: {
          //   populate: ['share_image']
          // }
        },
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );


    const pageRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/quizzes?${pageQuery}`)
    const pageJson = await pageRes.json()
    const pageData = pageJson.data[0]

    if (!pageData) {
      return {
        notFound: true,
      }
    }

    const questionsWithIds = pageData.attributes.questions.map(question => {
      return {
        ...question,
        uid: nanoid()
      }
    })

    const quiz = { id: pageData.id, ...pageData.attributes, questions: questionsWithIds }

    const welcomeBlock = {
            name: 'welcome-screen',
            id: 'welcome-screen',
            attributes: {
              label: quiz.title,
              description: quiz.description,
              buttonText: quiz.start_button || "Start the quiz"
            }
          }

    const questionBlocks = quiz.questions.map(q => {
      switch (q.__component) {
        case 'quiz.multiple-choice':
          return {
            name: 'multiple-choice',
            id: q.uid,
            attributes: {
              required: true,
              verticalAlign: true,
              multiple: q.multiple_select,
              description: q.help_text,
              label: q.question_text,
              choices: q.choice
            },
          }
          break;
        case 'quiz.true-false':
          return {
            name: 'multiple-choice',
            id: q.uid,
            attributes: {
              required: true,
              verticalAlign: false,
              label: q.question_text,
              description: q.help_text,
              choices: [
                { label: 'True', value: 'true'},
                { label: 'False', value: 'false'}
              ]
            },
          }
          break;
        default:
          console.log(`Unrecognized component: ${q.__component}`)
      }
    })
    
    const answers = quiz.questions.reduce((obj, q) => {
      switch (q.__component) {
        case 'quiz.multiple-choice':
          return {
            ...obj,
            [q.uid]: {
              correctAnswers: q.choice.map(c => c.correct ? c.value : null).filter(i => i),
              explanation: q.explanation_text
            }
          }
          break;
        case 'quiz.true-false':
          return {
            ...obj,
            [q.uid]: {
              correctAnswers: q.correct ? "true" : "false",
              explanation: q.explanation_text
            }
          }
          break;
        default:
          console.log(`Unrecognized component: ${q.__component}`)
      }
    }, {})

    questionBlocks.unshift(welcomeBlock)

    const content = { quiz, questionBlocks, answers }

    return { 
      props: { content, layout },
      revalidate: process.env.NEXT_PUBLIC_PREVIEW_MODE ? REVALIDATE_SECONDS : false
    }
}

export default function QuizPage({ content, layout }) {
    const { quiz, questionBlocks, answers } = content;
    const router = useRouter()
    const {locale} = router
    const [correctAnswers, setCorrectAnswers] = useState()
    const terms = layout.translation

    const datePublished = new Date(quiz.date_published)
    const dateLocale = locale === "fr" ? 'fr-CA' : 'en-CA'
    const dateString = datePublished.toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })

    let localizations;
    if (quiz.localizations?.data && quiz.localizations?.data.length > 0) {
      localizations = quiz.localizations.data.map(l => {
        return ({
          ...l.attributes,
          link: `${l.attributes.locale}/quiz/${l.attributes.slug}`
        })
      })
    }

    let seo = {
      title: quiz.title,
      description: quiz.preview,
      type: "quiz",
    }

    let mainImage;

    if (quiz.main_image?.data?.attributes) {
      let sizedImage = quiz.main_image.data.attributes

      if (quiz.main_image.data.attributes.formats?.small) {
        sizedImage = quiz.main_image.data.attributes.formats.small
      }

      if (quiz.main_image.data.attributes.formats?.medium) {
        sizedImage = quiz.main_image.data.attributes.formats.medium
      }

      mainImage = {
        ...quiz.main_image.data.attributes,
        thumbnail: sizedImage,
        src: `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${quiz.main_image.data.attributes.url}`, 
        alt: quiz.main_image.data.attributes.alternativeText,
        description: quiz.main_image.data.attributes.caption
      }
    }


    if (mainImage) {
      seo.image = `${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${mainImage.url}`
    }

    if (quiz.SEO) {
      seo = { ...seo, ...quiz.SEO }
    }



    return (
        <>
            <Layout 
              {...layout} 
              localizations={localizations}
              seo={seo}
              title={quiz.title}
            >
              <main id="main" className="site-main quiz-page" role="main">
                <section className="quiz-section" style={mainImage ? {backgroundImage: `url(${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${mainImage.url})`} : {}}>
                  <div className="overlay" />
                  <div className="container">
                    <div id="quiz-container" className="row">
                      <div className="corner-box" />
                      <div className="corner-box" />
                      <div className="corner-box" />
                      <div className="corner-box" />
                      <div className="quiz-content">
                        <div id="quiz-inner-container" className={`${correctAnswers ? "quiz-result" : "quiz-questions"}`}>
                          <Form
                            formId={quiz.slug}
                            formObj={{
                              blocks: questionBlocks,
                              settings: {
                                animationDirection: "vertical",
                                disableWheelSwiping: false,
                                disableNavigationArrows: false,
                                disableProgressBar: false
                              },
                              messages: {
                                "label.answersExplanation": quiz.explanation,
                                "block.defaultThankYouScreen.label": quiz.result_correct,
                                "label.hintText.enter": quiz.press_enter,
                                "label.progress.percent": quiz.progress_bar_label,
                                "label.errorAlert.required": quiz.required_field,
                                "label.submitBtn": quiz.submit,
                                "label.correct": quiz.correct,
                                "label.incorrect": quiz.incorrect,
                                "label.yourAnswer": quiz.your_answer,
                              },
                              theme: {
                                font: "Space Mono",
                                fontSize: {
                                  lg: '16px',
                                  sm: '12px'
                                },
                                questionsLabelFontSize: {
                                  lg: '20px',
                                  sm: '16px'
                                },
                                buttonsBgColor: "rgb(16, 249, 187)",
                                logo: {
                                  src: ""
                                },
                                questionsColor: "rgb(16, 249, 187)",
                                answersColor: "rgb(16, 249, 187)",
                                buttonsFontColor: "var(--primary-color-one)",
                                buttonsBorderRadius: 25,
                                errorsFontColor: "var(--text-color-light)",
                                errorsBgColor: "#f00",
                                progressBarFillColor: "rgb(6, 214, 160)",
                                progressBarBgColor: "#ccc",
                                backgroundColor: "transparent"
                              },
                              correctIncorrectQuiz: {
                                enabled: true,
                                questions: answers,
                                showAnswersDuringQuiz: true
                              },
                              customCSS: `
                                .multiplechoice__options .multipleChoice__optionWrapper.correct {
                                  background: rgba(6, 214, 160,0.7) !important;
                                }
                                .multiplechoice__options .multipleChoice__optionWrapper.wrong {
                                  background: rgba(237, 37, 78,0.7) !important;
                                };
                                .renderer-components-field-content {
                                  max-width: 800px;
                                }
                                .renderer-components-default-thankyou-screen {
                                  padding: unset;
                                }
                                .renderer-components-default-thankyou-screen p {
                                  font-weight: 700;
                                }
                                .blocktype-welcome-screen-block .renderer-components-block-label p {
                                  font-weight: 700;
                                }
                                .blocktype-welcome-screen-block .renderer-components-block-description p {
                                  font-size: 13px;
                                  line-height: 1.2;
                                }
                              `
                            }}
                            onSubmit={(data, { completeForm, setIsSubmitting }) => {
                              try {
                                const correctCount = quiz.questions.filter(q => data.answers[q.uid].isCorrect).length
                                setCorrectAnswers(correctCount)
                              } catch (e) {
                                console.log(e)
                              } finally {
                                setIsSubmitting(false);
                                completeForm();
                              }
                            }}
                            
                          />

                        </div>
          
                        { quiz.results.map(result => {
                          const hidden = !correctAnswers || (correctAnswers && !(correctAnswers >= result.min_score && correctAnswers <= result.max_score))
                          return (
                            <div className="recommendations" key={`result-${result.id}`} hidden={hidden}>
                              <div className="row">
                                <div className="col-12">
                                  <div className="title_sections">
                                    <p className="mb-4 heading">
                                      {result.heading}
                                    </p>
                                  </div>
                                  
                                  <BlocksRenderer 
                                    content={result.explanation} 
                                    blocks={{
                                      image: ({ image }) => {
                                        return (
                                          <Image
                                            src={image.url}
                                            width={image.width}
                                            height={image.height}
                                            alt={image.alternativeText || ""}
                                          />
                                        );
                                      },
                                      link: ({ children, url }) => {
                                        if (url.startsWith('http')) {
                                          return <a href={url} target="_blank">{children}</a>
                                        } else {
                                          return <Link href={url}>{children}</Link>
                                        }
                                      }
                                    }}
                                  />

                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div className="text-center mb-5" hidden={!correctAnswers}>
                          <ButtonLink href={`/${router.locale}/quiz/${quiz.slug}`}>{quiz.start_over}</ButtonLink>
                        </div>
                      </div>
                    </div>
                  </div>
                  {mainImage && <small className="caption">{mainImage.caption}</small>}
                </section>

              </main>
            </Layout>
        </>
    )
}
