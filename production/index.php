<?php
/*
$data = array();
$lang = explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']);
foreach ($lang as $l) {
    $n = explode(';', trim($l), 2);
    if (sizeof($n) == 2) {
        $num = explode('=', $n[1]);
        $data[trim($n[0])] = trim($num[1]);
    }
    else $data[trim($l)] = 1;
}

arsort($data);

foreach ($data as $lang => $q) {
    if (!strcasecmp($lang, 'ru-RU') || !strcasecmp($lang, 'ru')) {
        header("Location: ./index.ru.html", true, 301);
        exit("<a href=\"./index.ru.html\">Решатель судоку</a>");
    }
    if (!strcasecmp($lang, 'en-us') || !strcasecmp($lang, 'en-gb') || !strcasecmp($lang, 'en')) {
        header("Location: ./index.en.html", true, 301);
        exit("<a href=\"./index.en.html\">Sudoku Solver</a>");
    }
}*/

header("Location: http://sudokusolver.tk/en", true, 301);
exit("<a href=\"http://sudokusolver.tk/en\">Sudoku Solver</a>");

?>