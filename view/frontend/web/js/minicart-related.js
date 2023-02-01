define(
    [
        'uiComponent',
        'Magento_Customer/js/customer-data',
        'underscore',
        'knockout',
        'mage/cookies',
        'jquery'
    ],

    function (Component, customerData, _, ko, cookies, $) {

        'use strict';

        return Component.extend({

            defaults: {
                template: 'Pixel_RelatedProductsMinicart/minicart-related',
                items: ko.observableArray([]),
                tracks: {
                    itemsSku: true
                }
            },

            initialize: function () {
                this._super();
                let self = this,
                    cart = customerData.get('cart');


                customerData.getInitCustomerData().done(function () {

                    if (!_.isEmpty(cart())) {
                        self.itemsSku = self.cartItemsSku(cart().items);
                    };

                    cart.subscribe(function (cart) {
                        self.itemsSku = self.cartItemsSku(cart.items);
                    });


                })

                self.itemsSku = ko.computed(function () {

                    let products = self.itemsSku;

                    if (typeof products !== 'string') {
                        return;
                    }

                    self.getRelatedProductsByID(products);

                });

                $('body').on('click', '.add-related-to-cart', function (e) {
                    e.preventDefault();
                    const $this = this,
                        formKey = $.mage.cookies.get('form_key'),
                        productID = $this.getAttribute('data-product-id'),
                        postUrl = BASE_URL + 'checkout/cart/add/';

                    if (productID) {
                        fetch(postUrl, {
                            "headers": {
                                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            "body": "form_key=" + formKey + "&product=" + productID + "&uenc=" + btoa(window.location.href),
                            "method": "POST",
                            "mode": "cors",
                            "credentials": "include"
                        }).then(function (response) {
                            if(response.status == 200){

                                self.updateMinicart();

                            }
                        })

                    }
                })
            },
            updateMinicart : function () {

                var sections = ['cart'];
                customerData.invalidate(sections);
                customerData.reload(sections, true);

            },

            /**
             * Return Just SKU of products in cart
             */
            cartItemsSku: function (product) {

                let skuArray = [];

                for (const el of product) {
                    skuArray.push(el.product_sku)
                }
                let arrStringify = JSON.stringify(skuArray);
                return arrStringify;
            },

            /**
             * Get related products by product ID
             */
            getRelatedProductsByID: function (id) {
                const relatedItems = [];
                let self = this;
                const query = `{
              products(filter: { sku: { in: ${id} } }) {
                items {
                  id
                  name
                  related_products {
                    id
                    sku
                    stock_status
                    url_key
                    name
                     small_image {
        url
      },
                  }
                }
              }
            } `;

                fetch('https://app.exampleproject.test/graphql?query=' + query,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                    }
                )
                    .then((response) => response.json())
                    .then((data) => {

                        const elem = (
                            data &&
                            data.data &&
                            data.data.products &&
                            data.data.products.items
                        ) || {};
                        self.items(elem);
                    })

            }


        });
    })
