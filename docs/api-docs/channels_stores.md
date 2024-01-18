# Tiendas y Canales

## Estructura general

| Campo    | Tipo                  | Descripción                                                                      |
| -------- | --------------------- | -------------------------------------------------------------------------------- |
| vendorId | string                | Identificador único de la marca. \*Este identificador es suministrado por Trade. |
| channels | [Channel](#Channel)[] | Más adelante se describe la estructura para canales de venta                     |
| stores   | [Store](#stores)[]    | Más adelante se describe la estructura para tiendas.                             |

### Channel

| Campo          | Tipo                | Descripción                                                                                    |
| -------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| channelId      | string              | Identificador del canal de venta, este identificador debe ser definido por el cliente del API. |
| channel        | string              | Nombre del canal venta                                                                         |
| active         | boolean             | Estado del canal de ventas.                                                                    |
| additionalInfo | Record<string, any> | Información adicional del canal de ventas.                                                     |

### Stores

| Campo              | Tipo                                       | Descripción                                                                                            |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| storeId            | string                                     | Identificador único de la tienda, este identificador debe ser definido por el cliente del API.         |
| name               | string                                     | Nombre de la tienda                                                                                    |
| default            | boolean                                    | Determina si la tienda es predeterminada.                                                              |
| featured           | boolean                                    | Determina si la tienda es destacada.                                                                   |
| storeCode          | string                                     | Conjunto de caracteres que identifican a la tienda.                                                    |
| services           | [Service](#service)[]                      | Permite definir información sobre otros servicios que posea la tienda. Ej: heladería, juguetería,      |
| storeChannels      | string[]                                   | Permite definir los canales de venta que utilizará la tienda. (Deben estar definidos en channels).     |
| schedulesByChannel | [SchedulesByChannel](#schedulebychannel)[] | Permite definir horarios de tienda por canal de venta, más adelante se define la estructura requerida. |
| taxesInfo          | [Taxes](#taxes)                            | Permite definir la información relacionada a impuestos por defecto a usarse en la tienda.              |
| contactInfo        | [ContactInfo](#contactinfo)                | Informacion de contacto de la tienda.                                                                  |
| deliveryInfo       | [DeliveryInfo](#deliveryinfo)              | Información para el delivery de la tienda.                                                             |
| locationInfo       | [LocationInfo](#locationinfo)              | Informacion de geoposicionamiento de la tienda.                                                        |
| schedules          | [Schedule](#schedule)[]                    | Horario de la tienda por defecto aplicado a todos los canales de venta.                                |

#### Service

| Campo  | Tipo                  | Descripción         |
| ------ | --------------------- | ------------------- |
| name   | string                | Nombre del servicio |
| status | enum(ACTIVE,INACTIVE) | Estado del servicio |

#### LocationInfo

| Campo     | Tipo         | Descripción                                           |
| --------- | ------------ | ----------------------------------------------------- |
| city      | string       | Nombre de la ciudad en la que se encuentra la tienda. |
| latitude  | numberstring | Latitud de la tienda                                  |
| longitude | numberstring | Longitud de la tienda                                 |

#### ContactInfo

| Campo   | Tipo   | Descripción                          |
| ------- | ------ | ------------------------------------ |
| phone   | string | Teléfono de contacto para la tienda. |
| address | string | Dirección completa de la tienda.     |

#### Taxes

| Campo             | Tipo | Descripción                                              |
| ----------------- | ---- | -------------------------------------------------------- |
| taxRate           | int  | Permite definir la tasa de impuesto que grava la tienda. |
| vatRatePercentage | int  | Permite definir la tasa de iva que grava la tienda.      |

#### DeliveryInfo

| Campo             | Tipo            | Descripción                                                                             |
| ----------------- | --------------- | --------------------------------------------------------------------------------------- |
| deliveryTimeValue | int          | Valor de tiempo de entrega.                                                             |
| deliveryTimeUnit  | enum(min, hour) | Unidad de tiempo de entrega.                                                            |
| minimumOrder      | int             | Pedido mínimo de la tienda en pesos,dólares (dependiendo del País configurado por TRD). |
| shippingCost      | int             | Costo de envío de la tienda.                                                            |
| cookTime          | int             | Tiempo de preparación en minutos                                                        |

#### Schedule

| Campo     | Tipo       | Descripción             |
| --------- | ---------- | ----------------------- |
| day       | string     | Día del horario.        |
| startTime | time:'H:m' | Hora inicio del horario |
| endTime   | time:'H:m' | Hora fin del horario    |

#### ScheduleByChannel

| Campo     | Tipo                    | Descripción                                                                                   |
| --------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| channelId | string                  | dentificador del canal de venta, este identificador debe ser definido por el cliente del API. |
| schedules | [Schedule](#schedule)[] | Horario de la tienda para el canal definido.                                                  |
