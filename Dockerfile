FROM php:8.1-apache

# Install PostgreSQL extension
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite

# Copy project files
COPY . /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Configure Apache
RUN echo '<Directory /var/www/html/>\n\
    Options -Indexes +FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
    DirectoryIndex index.php index.html\n\
</Directory>\n\
<FilesMatch \.php$>\n\
    SetHandler application/x-httpd-php\n\
</FilesMatch>' > /etc/apache2/conf-available/docker-php.conf \
    && a2enconf docker-php

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
