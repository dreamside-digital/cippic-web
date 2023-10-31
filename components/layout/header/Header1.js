import Link from "next/link"
import Navbar from "../Navbar"

export default function Header1({ handleSearch, handleContactPopup, handleMobileMenu, topics, contentTypes, studentPages }) {
    return (
        <>
            <div className="header_area" id="header_contents">
                <header className="header header_default bg-one get_sticky_header">
                    <div className="container-xl">
                        <div className="row align-items-center">
                            <div className="col-lg-5 col-md-8 col-sm-8 col-xs-8 logo_column">
                                <div className="header_logo_box">
                                    <Link href="/" className="logo navbar-brand">
                                        <img src="/assets/images/cippic-logo-combined-dark.svg" alt="CIPPIC" className="logo_default" />
                                        <img src="/assets/images/cippic-logo-alt-dark.svg" alt="CIPPIC" className="logo__sticky" />
                                    </Link>
                                </div>
                            </div>
                            <div className="col-lg-7 col-md-4 col-sm-4 col-xs-4 menu_column">
                                <button onClick={handleMobileMenu} className="theme-btn one navbar_togglers"> 
                                    <div className="hamburger_menu">
                                        <span className="line" />
                                        <span className="line" />
                                        <span className="line" />
                                    </div>
                                </button>
                                <div className="header_content_collapse d-flex justify-content-end">
                                    <div className="header_menu_box">
                                        <div className="navigation_menu">
                                            <Navbar topics={topics} contentTypes={contentTypes} studentPages={studentPages} />
                                        </div>
                                    </div>
                                    <div className="header_right_content">
                                        <ul>
                                            <li>
                                                <button type="button" className="search-toggler" onClick={handleSearch}><i className="icon-search" /></button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
        </>
    )
}
