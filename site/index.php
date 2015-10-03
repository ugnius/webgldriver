<?php

$html = file_get_contents('../local.html');

$html = str_replace('site/style.css', 'style.css', $html);
$html = str_replace('js/apploader.js', 'compiled.js', $html);

print( $html );

$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : x.x.x.x;
$a = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'HTTP_USER_AGENT not set';

$log = fopen('../php_log.txt','a+');

fputs($log, date("Y-m-d H:i:s")." $ip $a\n");

fclose($log);

?>

