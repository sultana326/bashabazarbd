-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 24, 2026 at 11:45 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bashabazar`
--

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `image_id` int(11) NOT NULL,
  `listing_id` int(11) NOT NULL,
  `file_path` varchar(300) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`image_id`, `listing_id`, `file_path`, `uploaded_at`) VALUES
(1, 1, 'uploads/listing_1_img1.jpg', '2026-06-19 19:00:45'),
(2, 1, 'uploads/listing_1_img2.jpg', '2026-06-19 19:00:45'),
(3, 2, 'uploads/listing_2_img1.jpg', '2026-06-19 19:00:45'),
(4, 3, 'uploads/listing_3_img1.jpg', '2026-06-19 19:00:45'),
(5, 4, 'uploads/listing_4_img1.jpg', '2026-06-19 19:00:45'),
(6, 4, 'uploads/listing_4_img2.jpg', '2026-06-19 19:00:45'),
(7, 5, 'uploads/listing_5_img1.jpg', '2026-06-19 19:00:45'),
(8, 6, 'uploads/listing_6_img1.jpg', '2026-06-19 19:00:45'),
(9, 7, 'uploads/listing_7_img1.jpg', '2026-06-19 19:00:45');

-- --------------------------------------------------------

--
-- Table structure for table `listings`
--

CREATE TABLE `listings` (
  `listing_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `category` enum('house_rent','property_sale','furniture') NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `bedrooms` tinyint(3) UNSIGNED DEFAULT NULL,
  `status` enum('active','sold','rented') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `listings`
--

INSERT INTO `listings` (`listing_id`, `seller_id`, `category`, `title`, `description`, `price`, `location`, `city`, `bedrooms`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'house_rent', '3 bedroom flat in dhanmondi', 'spacious family flat near dhanmondi lake, with car parking and generator backup.', 28000.00, 'road no. 7, dhanmondi', 'dhaka', 3, 'active', '2026-06-19 18:59:42', '2026-06-19 18:59:42'),
(2, 1, 'property_sale', 'residential plot in bashundhara', '4 katha residential plot, road-facing, ready for construction.', 4500000.00, 'block d, bashundhara r/a', 'dhaka', NULL, 'active', '2026-06-19 18:59:42', '2026-06-19 18:59:42'),
(3, 5, 'furniture', 'sheesham wood sofa set (5 seater)', 'solid wood sofa set, lightly used, includes cushions.', 22000.00, 'mirpur 10', 'dhaka', NULL, 'active', '2026-06-19 18:59:42', '2026-06-19 18:59:42'),
(4, 5, 'house_rent', '2 bedroom apartment in chittagong', 'fully furnished apartment near gec circle, lift and security available.', 16000.00, 'gec circle', 'chattogram', 2, 'active', '2026-06-19 18:59:42', '2026-06-19 18:59:42'),
(5, 1, 'furniture', 'wooden dining table (6 seater)', 'teak wood dining set, very good condition.', 15000.00, 'agrabad', 'chattogram', NULL, 'active', '2026-06-19 18:59:42', '2026-06-19 18:59:42'),
(6, 5, 'property_sale', 'commercial shop space in sylhet', 'ground floor shop, prime location near zindabazar market.', 3200000.00, 'zindabazar', 'sylhet', NULL, 'sold', '2026-06-19 18:59:42', '2026-06-19 18:59:42'),
(7, 1, 'house_rent', '1 bedroom flat in uttara', 'compact flat suitable for small family, near uttara sector 7.', 12000.00, 'sector 7, uttara', 'dhaka', 1, 'rented', '2026-06-19 18:59:42', '2026-06-19 18:59:42');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `listing_id` int(11) NOT NULL,
  `message_body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `listing_id`, `message_body`, `is_read`, `sent_at`) VALUES
(1, 3, 1, 1, 'vai, flat ti ki ekhono khali ache? dekhte asbo kobe?', 0, '2026-06-19 19:03:33'),
(2, 1, 3, 1, 'ji, khali ache. apni rate ba bikele je kono din dekhte asben.', 0, '2026-06-19 19:03:33'),
(3, 4, 5, 3, 'sofa set er dam ki kichu komano jabe?', 0, '2026-06-19 19:03:33'),
(4, 5, 4, 3, 'dam fixed ache, tobe delivery free debo.', 0, '2026-06-19 19:03:33'),
(5, 6, 5, 7, 'shop ti ki bikri hoye geche? naki ekhono available?', 0, '2026-06-19 19:03:33'),
(6, 5, 6, 7, 'ji bikri hoye geche, dhonnobad apnar interest er jonno.', 0, '2026-06-19 19:03:33');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('buyer','seller') NOT NULL DEFAULT 'buyer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `phone`, `role`, `created_at`) VALUES
(1, 'rashedul islam', 'rashedul.islam@gmail.com', 'hashedpass1234abcd', '01712345678', 'seller', '2026-06-19 18:58:41'),
(2, 'abdul karim', 'akarim.dhaka@gmail.com', 'hashedpass5678efgh', '01812345679', 'seller', '2026-06-19 18:58:41'),
(3, 'farzana yasmin', 'farzana.yasmin@gmail.com', 'hashedpass9012ijkl', '01912345680', 'buyer', '2026-06-19 18:58:41'),
(4, 'imran hossain', 'imran.hossain@gmail.com', 'hashedpass3456mnop', '01612345681', 'buyer', '2026-06-19 18:58:41'),
(5, 'shirin sultana', 'shirin.sultana@gmail.com', 'hashedpass7890qrst', '01512345682', 'seller', '2026-06-19 18:58:41'),
(6, 'mahmudul hasan', 'mahmudul.h@gmail.com', 'hashedpass2345uvwx', '01312345683', 'buyer', '2026-06-19 18:58:41'),
(7, 'Admin', 'admin@bashabazar.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', '01700000000', 'seller', '2026-07-03 21:10:00');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `wishlist_id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `listing_id` int(11) NOT NULL,
  `saved_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`wishlist_id`, `buyer_id`, `listing_id`, `saved_at`) VALUES
(1, 3, 1, '2026-06-19 19:03:07'),
(2, 3, 5, '2026-06-19 19:03:07'),
(3, 4, 2, '2026-06-19 19:03:07'),
(4, 4, 4, '2026-06-19 19:03:07'),
(5, 6, 3, '2026-06-19 19:03:07'),
(6, 6, 7, '2026-06-19 19:03:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `idx_image_listing` (`listing_id`);

--
-- Indexes for table `listings`
--
ALTER TABLE `listings`
  ADD PRIMARY KEY (`listing_id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_price` (`price`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_seller` (`seller_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_msg_sender` (`sender_id`),
  ADD KEY `idx_msg_receiver` (`receiver_id`),
  ADD KEY `idx_msg_listing` (`listing_id`),
  ADD KEY `idx_msg_read` (`is_read`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`wishlist_id`),
  ADD UNIQUE KEY `uq_wishlist` (`buyer_id`,`listing_id`),
  ADD KEY `idx_wishlist_buyer` (`buyer_id`),
  ADD KEY `idx_wishlist_listing` (`listing_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `listings`
--
ALTER TABLE `listings`
  MODIFY `listing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `wishlist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `images`
--
ALTER TABLE `images`
  ADD CONSTRAINT `fk_image_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `listings`
--
ALTER TABLE `listings`
  ADD CONSTRAINT `fk_listing_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_message_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `fk_wishlist_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_wishlist_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
