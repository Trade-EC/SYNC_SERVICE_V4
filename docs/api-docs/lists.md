# Listas

## Estructura general

| Campo          | Tipo                              | Descripción                                                                                                                              |
| -------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| list           | [List](#list)                     | Información general de la lista que se va a crear, más adelante se describe su estructura.                                               |
| categories     | [Category](#category)[]           | Permite definir las categorias de productos, así como su organización en la lista. más adelante se describe la estructura de categorías. |
| products       | [Product](#product)[]             | Permite definir los productos o items, asi como su organización en la lista. más adelante se describe la estructura de productos.        |
| modifierGroups | [ModifierGroup](#modifiergroup)[] | Permite definir un listado de modificadores que se utilizarán en la lista.                                                               |

### List

| Campo                | Tipo                    | Descripción                                                                                                                         |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| listId               | string                  | Identificador único de la lista. Ej: pickup-menu, daily-menu                                                                        |
| listName             | string                  | Nombre que identifique a la lista. Ej: "menu app"                                                                                   |
| vendorId             | string                  | dentificador único de la marca. Este identificador es suministrado por Trade.                                                       |
| storeId\*            | replicate_in_all,string | Identificador único de la tienda, se refiere al parámetro storeId de la creación de tiendas y canales de venta (Sección 1).         |
| channelId            | string                  | Identificador único del canal de venta, se refiere al parámetro channelId de la creación de tiendas y canales de venta (Sección 1). |
| channelReferenceName | string                  | Nombre único de referencia, este nombre será utilizado para la búsqueda y asociación del canal estandarizado.                       |
| ecommerceChannelId   | string                  | Identificador del canal de venta unificado, hace referencia al identificador del canal estandarizado mostrado en la tabla anterior. |

- Nota: El valor replicate_in_all permite replicar lista actual para todas las tiendas.
- Nota 2: Si se desea replicar una lista para tiendas especificas es necesario enviar un string separado por comas de los ids únicos de tienda, ejemplo: "1,2,3".

### Category

| Campo                | Tipo                                | Descripción                                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| productCategoryId    | string                              | Identificador de la categoría, este identificador debe ser definido por el cliente del API.                                                                                                                                                                      |
| name                 | string                              | Nombre de la categoría                                                                                                                                                                                                                                           |
| displayInList        | boolean                             | Determina la visibilidad en el app/web.                                                                                                                                                                                                                          |
| featured             | boolean                             | Determina si una categoría es destacada.                                                                                                                                                                                                                         |
| crossSellingCategory | boolean                             | Determina si la categoría va utilizarse para venta cruzada (cross selling), al definir el valor en true: Una vez el cliente proceda a realizar el pago se le mostrará el listado de productos definidos en el atributo "productListing" a modo de recomendación. |
| position             | int                                 | Determina la posición en que se muestra en la lista.                                                                                                                                                                                                             |
| images               | [Image](#image)[]                   | Imagen para la categoría de productos                                                                                                                                                                                                                            |
| childCategories      | [Category](#category)[]             | Permite definir categorías en un segundo nivel (la estructura en la misma que categorías).                                                                                                                                                                       |
| productListing       | [ProductListing](#productlisting)[] | Permite definir los productos asociados a la categoría. NOTA: Todos los productos definidos en este listado serán mostrados en el app/web.                                                                                                                       |
| schedules            | [Schedule](#schedule)[]             | Horario de la categoría, si el valor es null se interpreta como disponibilidad 24/7.                                                                                                                                                                             |

### ModifierGroup

| Campo           | Tipo                                                                                              | Descripción                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| modifierId      | string                                                                                            | Identificador único del modificador, este identificador debe ser definido por el cliente del API.                                            |
| modifier        | string                                                                                            | Texto para el modificador. Ej: Selecciona tu sabor de bebida.                                                                                |
| minOptions      | int                                                                                               | Mínimo de opciones que deben seleccionarse                                                                                                   |
| maxOptions      | int                                                                                               | Máximo de opciones que deben seleccionarse                                                                                                   |
| visible         | boolean                                                                                           | Determina si el modificador se mostrará en el app o la web.                                                                                  |
| position        | int                                                                                               | Posición en la que se muestra el modificador, si el valor es null se mostrará en orden alfabético utilizando el parámetro modifier.          |
| type            | enum(RADIO, CHECKBOX, QUANTITY, SELECT, CUSTOMIZE, SUPER_SIZE, CUSTOMIZE_ADD, CUSTOMIZE_SUBTRACT) | Tipo de modificador.                                                                                                                         |
| modifierOptions | [ModifierOption](#modifieroption)[]                                                               | Permite definir las opciones que se aplicarán al modificador, más adelante se define la estructura para las opciones de modificador.         |
| additionalInfo  | Record<string, any>                                                                               | Permite definir información adicional mediante pares clave-valor Ej: {"menu_level": 0}, estos valores no serán mostrados en el app o la web. |

### ModifierOption

| Campo          | Tipo                | Descripción                                                                                                                                                      |
| -------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| optionId       | string              | Identificador único de la opción, este identificador debe ser definido por el cliente del API.                                                                   |
| productId      | string              | Identificador único del producto.                                                                                                                                |
| default        | boolean             | Permite definir si una opciòn de modificador se muestra preseleccionada o no.                                                                                    |
| position       | int                 | Posición en la que se muestra la opción, si el valor es null se mostrará en orden alfabético utilizando el parámetro name definido en la estructura de producto. |
| additionalInfo | Record<string, any> | Permite definir información adicional mediante pares clave-valor Ej: {"menu_level": 0}, estos valores no serán mostrados en el app o la web.                     |

### Product

| Campo           | Tipo                                | Descripción                                                                                                                                    |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| name            | string                              | Nombre del producto                                                                                                                            |
| productId       | string                              | Identificador único del producto                                                                                                               |
| type            | enum(PRODUCT, MODIFIER, COMPLEMENT) | Tipo de producto                                                                                                                               |
| description     | string                              | Descripción del producto                                                                                                                       |
| standardTime    | boolean                             | Determina si usa su horario propio o el de la tienda                                                                                           |
| featured        | boolean                             | Determina si un producto es destacado.                                                                                                         |
| modifierId      | string                              | Identificador único de un producto modificador.                                                                                                |
| taxesInfo       | [Tax](#tax)                         | Impuestos que aplica el producto.                                                                                                              |
| priceInfo       | [Price](#price)                     | Impuestos que aplica el producto.                                                                                                              |
| schedules       | [Schedule](#schedule)[]             | Horario de la tienda, si el valor es null se interpreta como atención 24/7.                                                                    |
| upselling       | string[]                            | Conjunto de identificadores únicos de productos utilizados en la venta adicional                                                               |
| crossSelling    | string[]                            | [int, string], null Conjunto de identificadores únicos de productos utilizados en la venta cruzada,                                            |
| tags            | string[]                            | permite asignar etiquetas al producto, esto puede ser útil en la búsqueda de productos                                                         |
| images          | [Image](#image)[]                   | Imágenes para el producto                                                                                                                      |
| productModifier | string[]                            | Permite asociar modificadores al producto, mas adelante se describe la logica para la posición de los modificadores.                           |
| additionalInfo  | Record<string, any>                 | Permite definir información adicional mediante pares clave-valor Ej: {"combo_number": 1}, estos valores no serán mostrados en el app o la web. |

#### Schedule

| Campo     | Tipo         | Descripción             |
| --------- | ------------ | ----------------------- |
| day       | string       | Día del horario.        |
| startTime | time:'H:m'   | Hora inicio del horario |
| endTime   | time:'H:m'   | Hora fin del horario    |
| startDate | date:'Y-m-d' | Hora inicio del horario |
| endDate   | date:'Y-m-d' | Hora inicio del horario |

#### Tax

| Campo             | Tipo | Descripción                                              |
| ----------------- | ---- | -------------------------------------------------------- |
| taxRate           | int  | Permite definir la tasa de impuesto que grava la tienda. |
| vatRatePercentage | int  | Permite definir la tasa de iva que grava la tienda.      |

#### Image

| Campo           | Tipo   | Descripción                                                                                     |
| --------------- | ------ | ----------------------------------------------------------------------------------------------- |
| imageCategoryId | string | Identificador único de la categoría de imágenes \*Este identificador es suministrado por Trade. |
| fileUrl         | string | Url de la imagen                                                                                |

#### ProductListing

| Campo     | Tipo   | Descripción                                                |
| --------- | ------ | ---------------------------------------------------------- |
| productId | string | Identificador único del producto.                          |
| position  | int    | Posición en la que se muestra el producto en la categoría. |

#### Price

| Campo               | Tipo   | Descripción                                                                                             |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| price               | number | Permite definir el precio final del producto (este precio se mostrará en el app o la web).              |
| pointPrice          | int    | Permite el precio en puntos.                                                                            |
| suggestedPrice      | number  | Permite definir el precio sugerido(fantasía) del producto (este precio se mostrará en el app o la web). |
| suggestedPointPrice | int    | Permite el precio sugerido(fantasía) en puntos.                                                         |
