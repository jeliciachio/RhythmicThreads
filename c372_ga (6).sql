-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2025 at 03:43 PM
-- Server version: 10.4.32-productrsvpsMariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `c372_ga`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cartId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `itemType` enum('Clothes','Vinyls') NOT NULL,
  `itemId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `addedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`cartId`, `userId`, `itemType`, `itemId`, `quantity`, `addedAt`) VALUES
(31, 1, 'Clothes', 18, 1, '2025-02-10 09:29:05'),
(32, 1, 'Clothes', 18, 1, '2025-02-10 09:29:33'),
(46, 4, 'Clothes', 17, 1, '2025-02-10 14:37:02');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `categoryId` int(11) NOT NULL,
  `categoryName` varchar(255) NOT NULL,
  `categoryDescription` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`categoryId`, `categoryName`, `categoryDescription`) VALUES
(1, 'Clothes', 'Various types of clothing'),
(2, 'Vinyls', 'Collection of vinyl records');

-- --------------------------------------------------------

--
-- Table structure for table `clothes`
--

CREATE TABLE `clothes` (
  `clothingId` int(11) NOT NULL,
  `clothingName` varchar(100) NOT NULL,
  `clothingDescription` text NOT NULL,
  `clothingImage` varchar(255) NOT NULL,
  `clothingPrice` decimal(10,2) NOT NULL,
  `clothingStock` int(11) NOT NULL,
  `productfilter` varchar(255) NOT NULL,
  `productType` varchar(50) NOT NULL DEFAULT '''Clothes''',
  `categoryId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clothes`
--

INSERT INTO `clothes` (`clothingId`, `clothingName`, `clothingDescription`, `clothingImage`, `clothingPrice`, `clothingStock`, `productfilter`, `productType`, `categoryId`) VALUES
(16, 'Buddy', 'what', '4fac791fa384fdc4a913af63b11a6386', 10.00, 9, 'Pants', 'Clothes', 1),
(17, 'Vintage Beige Nike Wind Breaker Jacket', 'Size M\r\nTop to Bottom= 29\"\r\nSleeve Length= 23\"', '1739129716262.png', 36.00, 5, 'Jackets', 'Clothes', 1),
(18, 'Polo Ralph Lauren Knitted Sweater', 'Size L\r\nTop to Bottom=31\"\r\nSleeve Length= 26\"', '1739129804036.png', 30.00, 5, 'Sweatshirts', 'Clothes', 1),
(19, 'Harley Davidson Evolution T-Shirt', 'Size M\r\nTop to Bottom= 27\"', '1739129857271.jpg', 25.00, 10, 'Shirts', 'Clothes', 1),
(20, 'no', 'what', '1739152311187.png', 19.00, 1, 'Shirts', 'Clothes', 1);

-- --------------------------------------------------------

--
-- Table structure for table `productfilter`
--

CREATE TABLE `productfilter` (
  `filterType` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `productfilter`
--

INSERT INTO `productfilter` (`filterType`) VALUES
('Shirts'),
('Pants'),
('Skirts'),
('Jackets'),
('Sweatshirts'),
('Pop'),
('RnB'),
('Jazz'),
('Band');

-- --------------------------------------------------------
-- Table structure for table `productrsvps`
CREATE TABLE ProductRSVPs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  productId INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(userId),
  FOREIGN KEY (productId) REFERENCES WhatsNew(id)
);


--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL COMMENT ' ',
  `type` enum('Clothes','Vinyl') NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT NULL,
  `categoryId` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `created_At` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `productType` enum('Clothes','Vinyls') NOT NULL,
  `username` varchar(255) NOT NULL,
  `comment` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `userId`, `productId`, `productType`, `username`, `comment`, `createdAt`) VALUES
(3, 4, 17, 'Clothes', 'tom', 'good product\r\n', '2025-02-10 13:16:54');

--
-- Triggers `reviews`
--
DELIMITER $$
CREATE TRIGGER `validate_product_exists` BEFORE INSERT ON `reviews` FOR EACH ROW BEGIN
    DECLARE product_exists INT;

    -- Check if productId exists in either clothes or vinyls
    SELECT COUNT(*) INTO product_exists
    FROM (
        SELECT clothingId AS productId FROM clothes WHERE clothingId = NEW.productId
        UNION ALL
        SELECT vinylId AS productId FROM vinyls WHERE vinylId = NEW.productId
    ) AS temp;

    -- If no matching product is found, raise an error
    IF product_exists = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid productId: Does not exist in clothes or vinyls';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transactionId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `userEmail` varchar(100) NOT NULL,
  `transactionDate` datetime NOT NULL,
  `itemsPurchased` text NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(50) NOT NULL,
  `orderId` varchar(50) NOT NULL,
  `transactionsId` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transactionId`, `userId`, `username`, `userEmail`, `transactionDate`, `itemsPurchased`, `totalAmount`, `paymentMethod`, `orderId`, `transactionsId`) VALUES
(4, 1, 'jel', 'mary@mary.com', '2024-12-04 16:47:05', '[{\"cartId\":11,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"50.00\",\"productName\":\"Vintage Jacket\"},{\"cartId\":12,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"20.00\",\"productName\":\"Band T-shirt\"}]', 70.00, '', '', ''),
(7, 1, '', '', '2025-02-06 06:06:18', '[{\"cartId\":19,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"36.00\",\"productName\":\"Vintage Beige Nike Wind Breaker Jacket\"}]', 36.00, 'PayPal', '6N8675379D727533G', '03046521ET318701G'),
(8, 1, '', '', '2025-02-06 06:11:11', '[{\"cartId\":21,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"30.00\",\"productName\":\"Polo Ralph Lauren Knitted Sweater\"}]', 30.00, 'PayPal', '8BP00753E10079810', '2G533992ER432160T'),
(9, 1, '', '', '2025-02-06 06:17:41', '[{\"cartId\":22,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"25.00\",\"productName\":\"Harley Davidson Evolution T-Shirt\"}]', 25.00, 'PayPal', '04842539GT502444A', '3NV7878086565232M'),
(10, 1, '', '', '2025-02-06 12:19:30', '[{\"cartId\":25,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"30.00\",\"productName\":\"Polo Ralph Lauren Knitted Sweater\"}]', 30.00, 'PayPal', '5003157108694701V', '6CH45293GH198154Y'),
(11, 4, 'tom', 'bryan@123.com', '2025-02-10 22:37:51', '[{\"cartId\":46,\"itemType\":\"Clothes\",\"quantity\":1,\"itemPrice\":\"36.00\",\"productName\":\"Vintage Beige Nike Wind Breaker Jacket\"}]', 36.00, 'PayPal', '645463059K9855458', '1UM30087Y0448471J');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `userEmail` varchar(100) NOT NULL,
  `userPassword` varchar(10) NOT NULL,
  `userRole` enum('user','admin') NOT NULL,
  `userImage` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `username`, `userEmail`, `userPassword`, `userRole`, `userImage`) VALUES
(1, 'jel', 'mary@mary.com', '1234', 'user', '49cd15aae163f3bfe80fbdd68f5c43f3'),
(3, 'bob', 'sam@sam.com', '567', 'admin', '12345'),
(4, 'tom', 'bryan@123.com', '$2a$10$IWL', 'user', '53be4e95e7f4bd8e735646e47e83d178');

-- --------------------------------------------------------

--
-- Table structure for table `vinyls`
--

CREATE TABLE `vinyls` (
  `vinylId` int(11) NOT NULL,
  `vinylName` varchar(100) NOT NULL,
  `vinylDescription` text NOT NULL,
  `vinylImage` varchar(255) NOT NULL,
  `vinylPrice` decimal(10,2) NOT NULL,
  `vinylStock` int(11) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `productfilter` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vinyls`
--

INSERT INTO `vinyls` (`vinylId`, `vinylName`, `vinylDescription`, `vinylImage`, `vinylPrice`, `vinylStock`, `categoryId`, `productfilter`) VALUES
(4, 'The Beatles - Abbey Road ', 'The Beatles most iconic album', 'abbeyroadvinyl.jpg', 40.00, 5, 2, 'pop'),
(5, 'Pink Floyd - Dark Side of the Moon', 'Pink Floyd classic album', 'darksideofthemoon.jpg', 35.00, 5, 2, 'pop'),
(6, 'Frank Ocean- Blonde ', 'Frank Ocean iconic album', 'blondevinyl.jpg', 40.00, 5, 2, 'rnb');

-- --------------------------------------------------------

--
-- Table structure for table `whatsnew`
--

CREATE TABLE `whatsnew` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_whatsnew_category` (`categoryId`),
  CONSTRAINT `fk_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`),
  CONSTRAINT `fk_whatsnew_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


--
-- Dumping data for table `whatsnew`
--

INSERT INTO `whatsnew` (`id`, `name`, `description`, `price`, `category`, `createdAt`, `image`) VALUES
(2, 'Sally Tan', 'owdk', 1.95, '1', '2025-02-09 20:49:10', '1739134150103.png');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cartId`),
  ADD KEY `fk_cart_user` (`userId`),
  ADD KEY `fk_cart_product` (`itemId`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`categoryId`);

--
-- Indexes for table `clothes`
--
ALTER TABLE `clothes`
  ADD PRIMARY KEY (`clothingId`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `productId` (`productId`),
  ADD KEY `reviews_ibfk_3` (`userId`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transactionId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `username` (`username`,`userEmail`);

--
-- Indexes for table `vinyls`
--
ALTER TABLE `vinyls`
  ADD PRIMARY KEY (`vinylId`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `whatsnew`
--
ALTER TABLE `whatsnew`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cartId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `categoryId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `clothes`
--
ALTER TABLE `clothes`
  MODIFY `clothingId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT ' ';

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transactionId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `vinyls`
--
ALTER TABLE `vinyls`
  MODIFY `vinylId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `whatsnew`
--
ALTER TABLE `whatsnew`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`itemId`) REFERENCES `clothes` (`clothingId`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `clothes`
--
ALTER TABLE `clothes`
  ADD CONSTRAINT `clothes_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `clothes` (`clothingId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`);

--
-- Constraints for table `vinyls`
--
ALTER TABLE `vinyls`
  ADD CONSTRAINT `vinyls_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
