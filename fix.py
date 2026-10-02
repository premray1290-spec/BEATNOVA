with open('static/css/style.css', 'a', encoding='utf-8') as f:
    f.write('''

/* =========================================
   GENERAL MOBILE RESPONSIVENESS
========================================= */
@media (max-width: 768px) {
    /* Header & Navigation */
    header {
        flex-direction: column;
        height: auto;
        padding: 15px;
        gap: 15px;
        align-items: flex-start;
    }
    
    header .logo {
        font-size: 20px;
    }

    nav {
        display: flex;
        overflow-x: auto;
        white-space: nowrap;
        width: 100%;
        padding-bottom: 5px;
        gap: 15px;
    }

    .nav-actions {
        width: 100%;
        justify-content: space-between;
    }
    
    .search-wrapper {
        width: 100%;
        margin-right: 10px;
    }
    
    .search-input {
        width: 100%;
    }

    /* Hero Section */
    .hero {
        grid-template-columns: 1fr;
        padding: 30px 5% 50px;
        text-align: center;
        gap: 40px;
    }
    
    .hero-content {
        align-items: center;
        margin: 0 auto;
    }
    
    .hero h1 {
        font-size: 32px;
        line-height: 1.2;
    }
    
    .hero p {
        font-size: 14px;
        text-align: center;
    }
    
    .hero-visual {
        margin: 0 auto;
        width: 100%;
    }

    /* Sections */
    .content-section {
        padding: 40px 5%;
    }
    
    .section-heading h2 {
        font-size: 24px;
    }

    /* Track Grid */
    .track-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 15px;
    }
    
    .track-cover {
        height: 140px;
    }

    /* Player Bar */
    .player-bar {
        height: auto;
        padding: 10px 15px;
        flex-direction: column;
        gap: 15px;
        bottom: 0;
    }
    
    .player-track {
        width: 100%;
        margin-right: 0;
    }
    
    .player-controls {
        width: 100%;
        justify-content: center;
    }
    
    .player-volume {
        width: 100%;
        justify-content: center;
        display: none; /* Hide volume on mobile to save space */
    }

    /* Adjust main padding for taller mobile player bar */
    .main-content {
        padding-bottom: 160px;
    }
    
    /* Cinematic Text */
    #cinematicText {
        font-size: 8vw !important;
    }
}

@media (max-width: 480px) {
    .track-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }
    .track-cover {
        height: 130px;
    }
    .hero h1 {
        font-size: 28px;
    }
}
''')
