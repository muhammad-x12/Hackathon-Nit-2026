<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>School Platform</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</head>

<body class="antialiased">
    <div id="app"></div>
</body>

</html>