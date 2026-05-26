<?php
declare(strict_types=1);

/**
 * Frontend Shell for Sciecola React App
 *
 * Routes all non-API requests to the React app entry point.
 * React handles routing internally via HashRouter (/#/route).
 * All API calls go through /api/* endpoints handled by bootstrap.php
 *
 * @version 3.0.0 - React + PHP Backend (Opsi A)
 */
?><!DOCTYPE html>
<html lang="id">
  <head>
    <title>SCIECOLA - SDGs Classification & Analysis</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SDGs classification and analysis uses a hybrid method combining keyword matching, semantic similarity, research depth, and causal analysis to assess research relevance to the SDGs.">
    <meta name="keywords" content="SDGs, sustainable development, research analysis, ORCID, DOI, classification" />
    <meta name="robots" content="INDEX,FOLLOW,NOARCHIVE,NOCACHE" />
    <meta name="access" content="Yes" />
    <meta name="applicable-device" content="pc,mobile" />
    <meta name="google-site-verification" content="9mVvrkXamiUxutovEQqEk2eiRcjLUWHLHcwssZo3GYs" />
    <meta name="referrer" content="origin-when-cross-origin" />

    <meta property="og:title" content="Sciecola - SDGs Classification & Analysis" />
    <meta property="og:description" content="AI-powered platform for analyzing research contributions to Sustainable Development Goals." />
    <meta property="og:image" content="https://sciecola.sangia.org/assets/cover/sicola-cover.jpg" />
    <meta property="og:image:alt" content="Sciecola - SDGs Classification &amp; Analysis" />
    <meta property="og:url" content="https://sciecola.sangia.org/" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="id" />
    <meta property="fb:app_id" content="1575594642876231" />
    <meta property="publisher" content="//www.facebook.com/111429340332887" />
    <meta name="robots" content="max-image-preview:large" />
    
    <meta name="twitter:site" content="@Sciecola" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Sciecola - SDGs Classification & Analysis" />
    <meta name="twitter:description" content="AI-powered platform for analyzing research contributions to Sustainable Development Goals." />
    <meta name="twitter:image" content="https://sciecola.sangia.org/assets/cover/sicola-cover.jpg" />
    <meta name="twitter:image:alt" content="Sciecola - SDGs Classification &amp; Analysis" />

    <meta name="website_owner" content="www.sangia.org" />
    <meta name="owner" content="PT. Sangia Research Media and Publishing" />
    <meta name="design" content="Rochmady and Sangia Publishing House AI Team" />
    <meta name="publisher" content="Sangia Publishing House" />

    <link rel="canonical" href="https://sciecola.sangia.org/" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>

    <script type="module" crossorigin src="/assets/sicola-ui/sicola-app.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/sicola-ui/sicola-app.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>