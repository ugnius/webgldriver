<?php

$ip = $_SERVER['REMOTE_ADDR'];
$a = $_SERVER['HTTP_USER_AGENT'];

if ( isset($_POST['data']) && $_POST['data'] == 'err' && isset($_POST['msg']) ) {
	$log = fopen('../post_err.txt','a+');
	$data = $_POST['msg'];
	fputs($log, date("Y-m-d H:i:s")." $ip $a $data\n");
	fclose($log);
}

if ( isset($_POST['data']) && $_POST['data'] == 'log' && isset($_POST['msg']) ) {
	$log = fopen('../post_log.txt','a+');
	$data = $_POST['msg'];
	fputs($log, date("Y-m-d H:i:s")." $ip $a $data\n");
	fclose($log);
}

?>