import Link from 'next/link'
import { useState, forwardRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Fade from 'react-reveal/Fade';
import { useContext } from 'react'
import { TranslationContext } from '@/contexts/TranslationContext'

const MobileMenu = forwardRef(function MobileMenu(props, ref) {
    const { handleMobileMenu, topics=[], contentTypes=[], links=[], localizations } = props;
    const router = useRouter()
    const locale = router.locale
    const terms = useContext(TranslationContext)

    const [isActive, setIsActive] = useState({
        status: false,
        key: "",
    })

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            })
        } else {
            setIsActive({
                status: true,
                key,
            })
        }
    }

    const keyTopics = topics.filter(t => t.featured)

    return (
        <>
            <div className="crt_mobile_menu">
                <div className="menu-backdrop" onClick={handleMobileMenu} />
                <nav className="menu-box">
                    <div className="text-end mb-3">
                        <button ref={ref} aria-label="Close" className="btn btn-clear" onClick={handleMobileMenu}><i className="fa-solid fa-x" /></button>
                    </div>
                    <form role="search" method="get" action={`/${locale}/search`}>
                        <label className="search-label" htmlFor="search">{terms.search}</label>
                        <input autoFocus id="mobile-search" type="search" className="search" placeholder={terms.search} name="term" title="Search" />
                        <button type="submit" className="sch_btn"> <i className="fa-solid fa-magnifying-glass"/></button>
                    </form>
                    <div className="menu-outer">
                        <ul id="myNavbar" className="navbar_nav">
                            <li className="menu-item mega_menu nav-item">
                                <Link href="/" className="nav-link">
                                    <span>{terms.home}</span>
                                </Link>
                            </li>
                            <li className="menu-item menu-item-has-children dropdown nav-item">
                                <button aria-label="toggle submenu" aria-expanded={Boolean(isActive.key == 1)} onClick={() => handleToggle(1)} className="nav-link dropdown-toggle">
                                    <span>{terms.our_work}</span>
                                </button>
                                <ul className="dropdown-menu" style={{ display: `${isActive.key == 1 ? "block" : "none"}` }}>
                                    <Fade>
                                        <li className="menu-item nav-item">
                                            <Link href={`/our-work`} className="dropdown-item nav-link">
                                                <span className="text-faded">{terms.all_work}</span>
                                            </Link>
                                        </li>
                                    </Fade>
                                    { contentTypes.map((item, index) => (
                                        <Fade key={item.id} delay={60*index+1}>
                                            <li className="menu-item nav-item">
                                                <Link href={`/our-work/${item.slug}`} className="dropdown-item nav-link">
                                                    <span className="text-faded">{item.name}</span>
                                                </Link>
                                            </li>
                                        </Fade>
                                    ))}
                                </ul>
                            </li>
                            <li className="menu-item menu-item-has-children dropdown nav-item">
                                <button aria-label="toggle submenu" aria-expanded={Boolean(isActive.key == 2)} onClick={() => handleToggle(2)} className="nav-link dropdown-toggle">
                                    <span>Issues</span>
                                </button>
                                <ul className="dropdown-menu" style={{ display: `${isActive.key == 2 ? "block" : "none"}` }}>
                                    <Fade>
                                        <li className="menu-item nav-item">
                                            <Link href={`/issues`} className="dropdown-item nav-link">
                                                <span className="text-faded">{terms.all_issues}</span>
                                            </Link>
                                        </li>
                                    </Fade>
                                    { keyTopics.map((topic, index) => (
                                        <Fade key={topic.id} delay={60*index}>
                                            <li className="menu-item nav-item">
                                                <Link href={`/issues/${topic.slug}`} className="dropdown-item nav-link">
                                                    <span className="text-faded">{topic.name}</span>
                                                </Link>
                                            </li>
                                        </Fade>
                                    ))}
                                </ul>
                            </li>
                            {
                                links.map(link => {
                                    return (
                                        <li key={link.link_path} className="menu-item  mega_menu nav-item">
                                            <Link href={`${link.link_path}`} className="nav-link">
                                                <span>{link.link_text}</span>
                                            </Link>
                                        </li>
                                    )
                                })
                            }
                            {
                                localizations && 
                                localizations.map(l => {
                                    return (
                                        <li key={l.link} className="menu-item  mega_menu nav-item">
                                            <Link href={l.link} locale={l.locale} className="nav-link uppercase">
                                                <span>{`${l.locale}`}</span>
                                            </Link>
                                        </li>
                                    )
                                })
                            }
                            {
                                !localizations &&
                                <li className="menu-item  mega_menu nav-item">
                                    <Link href={router.asPath} locale={router.locale === 'en' ? 'fr' : 'en'} className="nav-link uppercase">
                                        <span>{`${router.locale === 'en' ? 'FR' : 'EN'}`}</span>
                                    </Link>
                                </li>
                            }
                        </ul>

                    </div>
                </nav>
            </div>
        </>
    )
})

export default MobileMenu
