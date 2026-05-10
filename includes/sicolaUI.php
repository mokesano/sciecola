<?php
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
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sciecola - SDGs classification analysis uses hybrid method combining keyword matching, semantic similarity, research depth, and causal analysis to assess research relevance to the SDGs." />
    <meta name="keywords" content="SDGs, sustainable development, research analysis, ORCID, DOI, classification" />
    <meta name="robots" content="INDEX,FOLLOW,NOARCHIVE,NOCACHE" />

    <title>SCIECOLA - SDGs Classification & Analysis</title>

    <!-- Open Graph -->
    <meta property="og:title" content="Sciecola - SDGs Classification & Analysis" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://sciecola.sangia.org/" />
    <meta property="og:description" content="AI-powered platform for analyzing research contributions to Sustainable Development Goals." />
    <meta property="og:image" content="https://sciecola.sangia.org/assets/cover/sicola-cover.jpg" />

    <link rel="canonical" href="https://sciecola.sangia.org/" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>

    <script type="module" crossorigin src="/assets/sicola-ui/sicola-app.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/sicola-ui/sicola-app.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
