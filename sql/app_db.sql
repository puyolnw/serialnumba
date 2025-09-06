-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 06, 2025 at 08:24 PM
-- Server version: 8.0.17
-- PHP Version: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `app_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `hours_awarded` int(11) NOT NULL DEFAULT '1',
  `public_slug` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `status` enum('DRAFT','OPEN','CLOSED') DEFAULT 'DRAFT'
) ;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `title`, `description`, `start_date`, `end_date`, `hours_awarded`, `public_slug`, `created_by`, `status`) VALUES
(1, 'Web Development Workshop', '???????????????????????????????????????????????????????????????????????????????????? React ????????? Node.js', '2024-02-01 10:00:00', '2024-02-01 17:00:00', 8, 'web-dev-workshop-2024', 1, 'OPEN'),
(2, 'AI Technology Seminar', '????????????????????????????????????????????? AI ????????? Machine Learning', '2024-02-15 09:00:00', '2024-02-15 12:00:00', 3, 'ai-seminar-2024', 2, 'OPEN'),
(3, 'Database Design Course', '??????????????????????????????????????????????????????????????????????????????', '2024-03-01 14:00:00', '2024-03-01 18:00:00', 4, 'db-design-course-2024', 1, 'OPEN'),
(4, 'น้องใหม่ไอที', 'รับน้อง', '2025-09-11 01:50:00', '2025-09-11 10:49:00', 8, '-------------1757159938052', 1, 'OPEN'),
(5, 'สมัครใจ', 'ไม่มี', '2025-09-16 01:50:00', '2025-09-16 08:00:00', 12, '--------1757160513384', 1, 'OPEN'),
(6, 'ทดสอบ', 'ทดสอบ', '2025-09-08 10:00:00', '2025-09-08 11:00:00', 8, '------1757161223283', 1, 'OPEN'),
(7, 'ฟห', 'ฟหก', '2025-10-03 12:20:00', '2025-10-03 13:20:00', 8, '---1757184780297', 15, 'OPEN');

-- --------------------------------------------------------

--
-- Table structure for table `activity_reviews`
--

CREATE TABLE `activity_reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `serial_id` int(11) NOT NULL,
  `fun_rating` int(11) NOT NULL,
  `learning_rating` int(11) NOT NULL,
  `organization_rating` int(11) NOT NULL,
  `venue_rating` int(11) NOT NULL,
  `overall_rating` int(11) NOT NULL,
  `suggestion` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ;

--
-- Dumping data for table `activity_reviews`
--

INSERT INTO `activity_reviews` (`id`, `user_id`, `activity_id`, `serial_id`, `fun_rating`, `learning_rating`, `organization_rating`, `venue_rating`, `overall_rating`, `suggestion`, `created_at`, `updated_at`) VALUES
(1, 13, 2, 7, 2, 3, 3, 3, 3, 'ดีมาก', '2025-09-06 16:00:50', '2025-09-06 16:00:50'),
(2, 14, 4, 8, 3, 2, 3, 2, 5, 'ดีมากๆจ้า ', '2025-09-06 16:11:24', '2025-09-06 16:11:24'),
(3, 4, 6, 3, 3, 3, 3, 3, 3, NULL, '2025-09-06 19:28:47', '2025-09-06 19:28:47');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `identifier_type` enum('EMAIL','USERNAME','STUDENT_CODE') NOT NULL,
  `identifier_value` varchar(255) NOT NULL,
  `confirmed_by` int(11) NOT NULL,
  `confirmed_at` datetime NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `activity_id`, `identifier_type`, `identifier_value`, `confirmed_by`, `confirmed_at`, `user_id`) VALUES
(1, 1, 'EMAIL', 'student@example.com', 1, '2025-09-06 10:08:40', NULL),
(2, 2, 'EMAIL', 'student@example.com', 2, '2025-09-06 10:08:40', NULL),
(3, 1, 'EMAIL', 'john.doe@example.com', 1, '2025-09-06 10:08:40', NULL),
(4, 2, 'EMAIL', 'bob.wilson@example.com', 2, '2025-09-06 10:08:40', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `checkins`
--

CREATE TABLE `checkins` (
  `id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `identifier_type` enum('EMAIL','USERNAME','STUDENT_CODE') NOT NULL,
  `identifier_value` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `student_code` varchar(50) DEFAULT NULL,
  `dedup_hash` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL,
  `serial_sent` tinyint(1) NOT NULL DEFAULT '0',
  `serial_sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `checkins`
--

INSERT INTO `checkins` (`id`, `activity_id`, `identifier_type`, `identifier_value`, `name`, `student_code`, `dedup_hash`, `created_at`, `serial_sent`, `serial_sent_at`) VALUES
(1, 1, 'EMAIL', 'john.doe@example.com', NULL, NULL, 'd8e701226f3c8f2caa65002d95d7fd6b15b5e50fa176f13d655006a16ff7020b', '2025-09-06 10:08:40', 1, '2025-09-06 13:42:25'),
(2, 1, 'STUDENT_CODE', 'ST002', NULL, NULL, 'f2e26ccc533879117a23680929e009b7a37b28481ba7072ba2376c0ead0bf9da', '2025-09-06 10:08:40', 0, NULL),
(3, 1, 'USERNAME', 'jane_smith', NULL, NULL, 'bd783123b544e48ef9df56565ae3afbf23e8747c395438996aafc6a8f1a76723', '2025-09-06 10:08:40', 0, NULL),
(4, 2, 'EMAIL', 'bob.wilson@example.com', NULL, NULL, '863d52746424efde34c6cb097afb0d9062d33a24ead2abf7664b77cbb713d581', '2025-09-06 10:08:40', 1, '2025-09-06 13:32:05'),
(5, 4, 'EMAIL', 'opee195@gmail.com', NULL, NULL, '99f37ab6aa78082a5bbfa521e2c7a27280383b1e76632a977d230ddc99f141db', '2025-09-06 12:30:06', 1, '2025-09-06 20:31:51'),
(6, 4, 'EMAIL', 'opee1.95@gmail.com', NULL, NULL, 'e76fea93e170de45a5e3683afefbe0b5a22376ad43c0541db22949e88177d076', '2025-09-06 12:39:57', 1, '2025-09-06 20:31:51'),
(7, 6, 'EMAIL', 'opee195@gmail.com', NULL, NULL, '2ba235e479ad195d1d6fc54f7983177bb1a6855b793b784d2f1201a07d16d7ba', '2025-09-06 13:49:12', 1, '2025-09-06 13:49:29'),
(8, 6, 'EMAIL', 'opee.195@gmail.com', NULL, NULL, '14ad3e358053159c9c8cc75ea1cbcf96f5a03b97d32c14018dcbcd8fe2e5c1d6', '2025-09-06 13:52:52', 1, '2025-09-06 13:53:08'),
(9, 6, 'EMAIL', 'aelele19556@gmail.com', NULL, NULL, '1b0f71bff19a7421f3fccf824b9eb30e138323a97d39c4facabb289b7331cae9', '2025-09-06 17:17:31', 0, NULL),
(10, 6, 'EMAIL', 'gariok0981120250@gmail.com', NULL, NULL, 'df3f07b3da51e4626447dcc47ec0fe39c8013e3c41e852fcdb2b298c6bf28429', '2025-09-06 17:29:52', 1, '2025-09-06 17:30:46'),
(11, 6, 'EMAIL', '653170010104@rmu.ac.th', NULL, NULL, 'e12c8c3a867a4ff99c663a054eea0858fe077a89bacd5ddcdeb9e8a91f6313f7', '2025-09-06 17:30:16', 0, NULL),
(12, 6, 'EMAIL', 'aelele.19556@gmail.com', 'kittihat', '653170010327', '7b7dae43a63c56c36d5cc8a47068adccfb350d149234ad4206388524835cc3fa', '2025-09-06 19:04:27', 1, '2025-09-06 19:08:40'),
(13, 6, 'EMAIL', 'opee.1.95@gmail.com', 'ณเดช', '653170010222', 'd6b6ac157f11c9b82c13e5f003221be7da4230f167ddd392dc7132521e6f4987', '2025-09-06 19:19:33', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `email_queue`
--

CREATE TABLE `email_queue` (
  `id` int(11) NOT NULL,
  `to_email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `created_at` datetime NOT NULL,
  `sent_at` datetime DEFAULT NULL,
  `attempts` int(11) NOT NULL DEFAULT '0',
  `max_attempts` int(11) NOT NULL DEFAULT '3',
  `error_message` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `email_queue`
--

INSERT INTO `email_queue` (`id`, `to_email`, `subject`, `body`, `status`, `created_at`, `sent_at`, `attempts`, `max_attempts`, `error_message`) VALUES
(1, 'student@example.com', 'Serial Code - Web Development Workshop', 'Your serial code: ABC123XYZ789', 'SENT', '2025-09-06 10:08:40', '2024-02-01 11:00:00', 0, 3, NULL),
(2, 'student@example.com', 'Serial Code - AI Technology Seminar', 'Your serial code: DEF456GHI012', 'SENT', '2025-09-06 10:08:40', '2024-02-15 06:00:00', 0, 3, NULL),
(3, 'john.doe@example.com', 'Serial Code - Web Development Workshop', 'Your serial code: GHI789JKL345', 'SENT', '2025-09-06 10:08:40', '2024-02-01 11:30:00', 0, 3, NULL),
(4, 'bob.wilson@example.com', 'Serial Code - AI Technology Seminar', 'Your serial code: MNO678PQR901', 'SENT', '2025-09-06 10:08:40', '2025-09-06 13:12:27', 1, 3, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `mail_settings`
--

CREATE TABLE `mail_settings` (
  `id` int(11) NOT NULL DEFAULT '1',
  `method` enum('GMAIL_API','GMAIL_SMTP') NOT NULL DEFAULT 'GMAIL_API',
  `sender_email` varchar(255) NOT NULL,
  `client_id` text,
  `client_secret` text,
  `redirect_uri` text,
  `refresh_token` text,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int(11) DEFAULT '587',
  `workspace_domain` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `mail_settings`
--

INSERT INTO `mail_settings` (`id`, `method`, `sender_email`, `client_id`, `client_secret`, `redirect_uri`, `refresh_token`, `smtp_host`, `smtp_port`, `workspace_domain`, `updated_at`) VALUES
(1, 'GMAIL_API', 'your-email@gmail.com', '', '', '', '', '', 587, '', '2025-09-06 12:46:38');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `type` enum('INFO','SUCCESS','WARNING','ERROR') NOT NULL DEFAULT 'INFO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`, `type`) VALUES
(1, 3, 'Serial Redeemed', '??????????????????????????? Serial ABC123XYZ789 ??????????????????????????? 8 ?????????????????????', 1, '2025-09-06 10:08:40', 'INFO'),
(2, 3, 'Serial Redeemed', '??????????????????????????? Serial DEF456GHI012 ??????????????????????????? 3 ?????????????????????', 1, '2025-09-06 10:08:40', 'INFO'),
(3, 3, 'New Activity', '???????????????????????????????????????: Database Design Course', 0, '2025-09-06 10:08:40', 'INFO');

-- --------------------------------------------------------

--
-- Table structure for table `serials`
--

CREATE TABLE `serials` (
  `id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('PENDING','SENT','REDEEMED') NOT NULL DEFAULT 'PENDING',
  `sent_at` datetime DEFAULT NULL,
  `redeemed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `identifier_value` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `serials`
--

INSERT INTO `serials` (`id`, `activity_id`, `code`, `user_id`, `status`, `sent_at`, `redeemed_at`, `created_at`, `identifier_value`) VALUES
(1, 1, 'ABC123XYZ789', 3, 'REDEEMED', '2024-02-01 11:00:00', '2024-02-02 02:15:00', '2025-09-06 10:08:40', NULL),
(2, 2, 'DEF456GHI012', 3, 'REDEEMED', '2024-02-15 06:00:00', '2024-02-16 07:20:00', '2025-09-06 10:08:40', NULL),
(3, 1, 'GHI789JKL345', 14, 'REDEEMED', '2024-02-01 11:30:00', '2025-09-06 16:06:54', '2025-09-06 10:08:40', NULL),
(4, 2, 'MNO678PQR901', 14, 'REDEEMED', NULL, '2025-09-06 16:07:10', '2025-09-06 10:08:40', NULL),
(5, 4, 'TKYN16QSOA4L', NULL, 'SENT', NULL, NULL, '2025-09-06 13:12:07', NULL),
(6, 4, 'HI5ERIGNOVG3', NULL, 'SENT', NULL, NULL, '2025-09-06 13:12:38', NULL),
(7, 4, 'KQN6TIOH6IN4', NULL, 'SENT', NULL, NULL, '2025-09-06 13:12:38', NULL),
(8, 4, 'SZGB5FMH4VWK', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:12', NULL),
(9, 4, '7UL6GQ8MPN6M', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:13', NULL),
(10, 4, 'L644LQSXZ225', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:14', NULL),
(11, 4, 'D0WUWG8DKOBV', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:14', NULL),
(12, 4, '0QR7U50MAQ1U', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:15', NULL),
(13, 4, '9GZYWTBJV1LT', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:15', NULL),
(14, 4, 'E4ZBY1O6QABZ', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:15', NULL),
(15, 4, 'CMY7B943101J', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:16', NULL),
(16, 4, 'EOP62Z106R3L', NULL, 'SENT', NULL, NULL, '2025-09-06 13:14:37', NULL),
(17, 4, '7Y3GTK734RPJ', NULL, 'SENT', NULL, NULL, '2025-09-06 13:15:12', NULL),
(18, 4, 'C4LT4K42PE0Z', NULL, 'SENT', NULL, NULL, '2025-09-06 13:16:24', NULL),
(19, 1, 'XL6WMCDQ4OLB', NULL, 'SENT', NULL, NULL, '2025-09-06 13:17:11', NULL),
(20, 6, 'JZ7MR4Y379CS', 13, 'REDEEMED', NULL, '2025-09-06 16:05:56', '2025-09-06 13:17:13', NULL),
(21, 2, 'O1WAB75E5USG', NULL, 'SENT', NULL, NULL, '2025-09-06 13:17:14', NULL),
(22, 4, 'B09P3L83UZMB', NULL, 'SENT', NULL, NULL, '2025-09-06 13:17:46', NULL),
(23, 4, 'UVMJQL26XNC1', NULL, 'SENT', NULL, NULL, '2025-09-06 13:19:23', NULL),
(24, 4, '2WBHOPCMHMG9', NULL, 'SENT', NULL, NULL, '2025-09-06 13:19:51', NULL),
(25, 4, 'MTF85OJL2HPN', NULL, 'SENT', NULL, NULL, '2025-09-06 13:19:57', NULL),
(26, 4, 'PY238F0TYU5M', NULL, 'SENT', NULL, NULL, '2025-09-06 13:20:00', NULL),
(27, 4, 'EAWRH4W9K4WN', NULL, 'SENT', NULL, NULL, '2025-09-06 13:20:03', NULL),
(28, 4, 'B1OATGSS13R4', NULL, 'SENT', NULL, NULL, '2025-09-06 13:20:04', NULL),
(29, 4, 'FLB7ZO5VI199', NULL, 'SENT', NULL, NULL, '2025-09-06 13:20:05', NULL),
(30, 4, 'WOW58RNHHPN3', NULL, 'SENT', NULL, NULL, '2025-09-06 13:20:06', NULL),
(31, 4, 'MLTBCSXSUO31', NULL, 'SENT', NULL, NULL, '2025-09-06 13:20:06', NULL),
(32, 4, 'EBBB2FW79NCB', 14, 'REDEEMED', NULL, '2025-09-06 16:09:47', '2025-09-06 13:20:07', NULL),
(33, 4, '1B39W2Q6P20Y', 13, 'REDEEMED', NULL, '2025-09-06 16:05:36', '2025-09-06 13:20:26', NULL),
(34, 4, 'OKYSH8ZST9F9', 13, 'REDEEMED', '2025-09-06 13:25:31', '2025-09-06 16:05:30', '2025-09-06 13:25:28', 'opee1.95@gmail.com'),
(35, 4, 'KSCYUC4I3CBN', 13, 'REDEEMED', '2025-09-06 13:30:29', '2025-09-06 15:22:11', '2025-09-06 13:30:25', 'opee195@gmail.com'),
(36, 2, 'C4YM8F7SO8B6', 13, 'REDEEMED', '2025-09-06 13:32:05', '2025-09-06 15:59:48', '2025-09-06 13:32:03', 'bob.wilson@example.com'),
(37, 1, 'IMDVYSZ9J8PY', 13, 'REDEEMED', NULL, '2025-09-06 15:57:54', '2025-09-06 13:42:01', 'jane_smith'),
(38, 1, 'F9LM13K59CJ5', 14, 'REDEEMED', '2025-09-06 13:42:25', '2025-09-06 16:08:12', '2025-09-06 13:42:22', 'john.doe@example.com'),
(39, 6, 'TY64ZLZ5TMM5', 4, 'REDEEMED', '2025-09-06 13:49:29', '2025-09-06 13:52:23', '2025-09-06 13:49:25', 'opee195@gmail.com'),
(40, 6, 'F3ZSC2TCKNX6', 13, 'REDEEMED', '2025-09-06 13:53:08', '2025-09-06 15:37:04', '2025-09-06 13:53:07', 'opee.195@gmail.com'),
(41, 6, 'K2YEAMW6CBOE', NULL, 'SENT', '2025-09-06 17:30:46', NULL, '2025-09-06 17:30:43', 'gariok0981120250@gmail.com'),
(42, 6, '4JJRMLFQY1HV', NULL, 'SENT', '2025-09-06 19:08:40', NULL, '2025-09-06 19:08:36', 'aelele.19556@gmail.com');

-- --------------------------------------------------------

--
-- Table structure for table `serial_history`
--

CREATE TABLE `serial_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `serial_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `hours_earned` int(11) NOT NULL DEFAULT '0',
  `redeemed_at` datetime NOT NULL,
  `is_reviewed` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `serial_history`
--

INSERT INTO `serial_history` (`id`, `user_id`, `serial_id`, `activity_id`, `hours_earned`, `redeemed_at`, `is_reviewed`) VALUES
(1, 3, 1, 1, 8, '2025-09-06 10:08:40', 0),
(2, 3, 2, 2, 3, '2025-09-06 10:08:40', 0),
(3, 4, 39, 6, 8, '2025-09-06 13:52:23', 1),
(4, 13, 35, 4, 8, '2025-09-06 15:22:11', 0),
(5, 13, 40, 6, 8, '2025-09-06 15:37:04', 0),
(6, 13, 37, 1, 8, '2025-09-06 15:57:54', 0),
(7, 13, 36, 2, 3, '2025-09-06 15:59:48', 0),
(8, 14, 32, 4, 8, '2025-09-06 16:09:47', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `refresh_token` varchar(500) NOT NULL,
  `expires_at` datetime NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL DEFAULT '1',
  `required_hours` int(11) NOT NULL DEFAULT '100',
  `updated_by` int(11) NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `required_hours`, `updated_by`, `updated_at`) VALUES
(1, 120, 1, '2025-09-06 12:04:51');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `role` enum('ADMIN','STAFF','STUDENT') NOT NULL DEFAULT 'STUDENT',
  `is_active` tinyint(1) DEFAULT '1',
  `name` varchar(100) NOT NULL,
  `student_code` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `enrollment_year` int(11) DEFAULT NULL,
  `program` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `role`, `is_active`, `name`, `student_code`, `password_hash`, `birth_date`, `gender`, `phone`, `address`, `enrollment_year`, `program`) VALUES
(1, 'admin@example.com', 'admin', 'ADMIN', 1, 'แอดมิน', NULL, '$2a$12$zaQGXffN6./8InzIFL1rFu5brwtet0UGwK.YGoZUAV9SfdWLfJUJG', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'staff@example.com', 'staff', 'STAFF', 1, 'สตาฟ', NULL, '$2a$12$vKHu1rdK9i.FHmYvkhr1fusPzMlXPy5asv7J.RvaoNw9UUG9kSlni', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'student@example.com', 'student', 'STUDENT', 1, '', NULL, '$2a$12$zaQGXffN6./8InzIFL1rFu5brwtet0UGwK.YGoZUAV9SfdWLfJUJG', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'hhh@hhh.hhh', '653170010327', 'STUDENT', 1, 'kittihat', '653170010327', '$2a$12$zaQGXffN6./8InzIFL1rFu5brwtet0UGwK.YGoZUAV9SfdWLfJUJG', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'dnd@dnd.dnd', 'hhh', 'ADMIN', 1, 'นิธิต', '', '$2a$12$6d2DTOsoI5KOfT6/6RZNWubuhJjgYO5UhVkdwK.kDzVrv1XbZ0l3u', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'hhh2@hhh.hhh', 'ฟกฟกฟหก', 'STUDENT', 1, 'หฟก', 'dadad', '$2a$12$SHo/R/QcBJx8JXZ5GvwsJe0i/MjZ.34hN2.jYudoijJGiKyJS/SqO', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'xx@xx.xx', 'xxxxxx', 'ADMIN', 1, 'อะไรวะ ', NULL, '$2a$12$EROSITYWXLr3LDXQFVHj..Tb5A0.LjuXiJSkbaCfvE9DrOVm8YUry', NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'opee.195@gmail.com', 'ak19556', 'STUDENT', 1, 'กิตติพัฒน์ ทุ่นทอง', '653170010111', '$2a$12$.tF1JEh4WrJpnGT1AWXY4e3UC1HwNsrwkRwBmU6HHvxVrqPB3Jx4.', NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'asdda@sdad.cc', 'puyolnw', 'STUDENT', 1, 'sadad', 'asdad', '$2a$12$c/ycMk7RHHpClymzR.NT1uIjOTEDX3irnRTmtycA4XZVbljnDxCg6', '2025-09-24', 'MALE', '0850150022', 'asdasd', 2550, 'asdasd'),
(15, 'sss@sss.sss', 'sss', 'STAFF', 1, 'stf', NULL, '$2a$12$m3ugfnlhz0SybYligh58uuua/RU.5X2pNG.B5q2L6bftiaDyCepm2', NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `public_slug` (`public_slug`),
  ADD UNIQUE KEY `public_slug_21` (`public_slug`),
  ADD UNIQUE KEY `public_slug_22` (`public_slug`),
  ADD UNIQUE KEY `public_slug_2` (`public_slug`),
  ADD UNIQUE KEY `public_slug_3` (`public_slug`),
  ADD UNIQUE KEY `public_slug_4` (`public_slug`),
  ADD UNIQUE KEY `public_slug_5` (`public_slug`),
  ADD UNIQUE KEY `public_slug_6` (`public_slug`),
  ADD UNIQUE KEY `public_slug_7` (`public_slug`),
  ADD UNIQUE KEY `public_slug_8` (`public_slug`),
  ADD UNIQUE KEY `public_slug_9` (`public_slug`),
  ADD UNIQUE KEY `public_slug_10` (`public_slug`),
  ADD UNIQUE KEY `public_slug_11` (`public_slug`),
  ADD UNIQUE KEY `public_slug_12` (`public_slug`),
  ADD UNIQUE KEY `public_slug_13` (`public_slug`),
  ADD UNIQUE KEY `public_slug_14` (`public_slug`),
  ADD UNIQUE KEY `public_slug_15` (`public_slug`),
  ADD UNIQUE KEY `public_slug_16` (`public_slug`),
  ADD UNIQUE KEY `public_slug_17` (`public_slug`),
  ADD UNIQUE KEY `public_slug_18` (`public_slug`),
  ADD UNIQUE KEY `public_slug_19` (`public_slug`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `activity_reviews`
--
ALTER TABLE `activity_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_activity` (`user_id`,`activity_id`),
  ADD KEY `idx_activity_rating` (`activity_id`,`overall_rating`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `serial_id` (`serial_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_id` (`activity_id`),
  ADD KEY `idx_identifier` (`identifier_type`,`identifier_value`),
  ADD KEY `confirmed_by` (`confirmed_by`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `checkins`
--
ALTER TABLE `checkins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_checkin` (`activity_id`,`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_20` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_21` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_2` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_3` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_4` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_5` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_6` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_7` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_8` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_9` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_10` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_11` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_12` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_13` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_14` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_15` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_16` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_17` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_18` (`dedup_hash`),
  ADD UNIQUE KEY `dedup_hash_19` (`dedup_hash`),
  ADD KEY `idx_activity_id` (`activity_id`),
  ADD KEY `idx_identifier` (`identifier_type`,`identifier_value`);

--
-- Indexes for table `email_queue`
--
ALTER TABLE `email_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `mail_settings`
--
ALTER TABLE `mail_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `serials`
--
ALTER TABLE `serials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `code_21` (`code`),
  ADD UNIQUE KEY `code_22` (`code`),
  ADD UNIQUE KEY `code_2` (`code`),
  ADD UNIQUE KEY `code_3` (`code`),
  ADD UNIQUE KEY `code_4` (`code`),
  ADD UNIQUE KEY `code_5` (`code`),
  ADD UNIQUE KEY `code_6` (`code`),
  ADD UNIQUE KEY `code_7` (`code`),
  ADD UNIQUE KEY `code_8` (`code`),
  ADD UNIQUE KEY `code_9` (`code`),
  ADD UNIQUE KEY `code_10` (`code`),
  ADD UNIQUE KEY `code_11` (`code`),
  ADD UNIQUE KEY `code_12` (`code`),
  ADD UNIQUE KEY `code_13` (`code`),
  ADD UNIQUE KEY `code_14` (`code`),
  ADD UNIQUE KEY `code_15` (`code`),
  ADD UNIQUE KEY `code_16` (`code`),
  ADD UNIQUE KEY `code_17` (`code`),
  ADD UNIQUE KEY `code_18` (`code`),
  ADD UNIQUE KEY `code_19` (`code`),
  ADD KEY `idx_activity_id` (`activity_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `serial_history`
--
ALTER TABLE `serial_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_serial_id` (`serial_id`),
  ADD KEY `idx_activity_id` (`activity_id`),
  ADD KEY `idx_redeemed_at` (`redeemed_at`),
  ADD KEY `idx_is_reviewed` (`is_reviewed`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `refresh_token` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_16` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_17` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_18` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_19` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_20` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_21` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_2` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_3` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_4` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_5` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_6` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_7` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_8` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_9` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_10` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_11` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_12` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_13` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_14` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_15` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_22` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_23` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_24` (`refresh_token`),
  ADD UNIQUE KEY `refresh_token_25` (`refresh_token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `student_code` (`student_code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_reviews`
--
ALTER TABLE `activity_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `checkins`
--
ALTER TABLE `checkins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `email_queue`
--
ALTER TABLE `email_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `serials`
--
ALTER TABLE `serials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `serial_history`
--
ALTER TABLE `serial_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `activity_reviews`
--
ALTER TABLE `activity_reviews`
  ADD CONSTRAINT `activity_reviews_ibfk_31` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `activity_reviews_ibfk_32` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `activity_reviews_ibfk_33` FOREIGN KEY (`serial_id`) REFERENCES `serials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_114` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_115` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_116` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `checkins`
--
ALTER TABLE `checkins`
  ADD CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `serials`
--
ALTER TABLE `serials`
  ADD CONSTRAINT `serials_ibfk_79` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `serials_ibfk_80` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `serial_history`
--
ALTER TABLE `serial_history`
  ADD CONSTRAINT `serial_history_ibfk_118` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `serial_history_ibfk_119` FOREIGN KEY (`serial_id`) REFERENCES `serials` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `serial_history_ibfk_120` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
