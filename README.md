# 🔄 Sync Service V4

## Descripción

El microservicio "Sync Service V4" se ha desarrollado con el objetivo de facilitar a los clientes la sincronización de sus tiendas y productos en el comercio electrónico de TRD de manera eficiente y rápida. Este microservicio simplifica la gestión de información al centrarse en las entidades fundamentales: tiendas y productos. Una optimización clave se encuentra en la gestión de productos, donde toda la información relacionada con un producto se almacena en un único objeto. Por ejemplo, un producto puede contener datos como la categoría asociada, los precios en diferentes tiendas y sus imágenes, lo que resulta en consultas más rápidas y una información centralizada. Documentación más extensa en este [enlace](https://docs.google.com/document/d/1LF5z8dWP8d5Q5SpuHaZZf0OIx0GToniv6xz2vm13pp4/edit?usp=sharing).

## 🌟 Nuevas Características Destacadas

- 🚀 Escalabilidad Automática Mejorada
- ⚡ Optimizaciones de Rendimiento
- 📊 Monitorización y Registro Mejorados
- 📚 Mejoras en la Documentación y Soporte

## Instalación

Para instalar las dependencias del proyecto, utilizar el siguiente comando:

```sh
yarn install
```

Debido a que este proyecto es serverless, no se puede ejecutar localmente es por ello que se debe configurar un ambiente en aws para su ejecución.

Para configurar tus credenciales en la terminal que se está ejecutando se debe utilizar el siguiente comando en la terminal:

```sh
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
```

Una vez que las credenciales están configuradas se puede desplegar esta solución en cualquiera de las cuentas de AWS que se requiera. Para hacer más fácil este trabajo se pueden ejecutar los siguientes comandos:

```sh
yarn deploy:kfc:dev
```

Este comando permite desplegar esta solución en el ambiente de kfc ecuador en desarrollo.

```sh
yarn deploy:artisncore:dev
```

Este comando permite desplegar esta solución en el ambiente de artisn core en desarrollo.

Al momento del despliegue, este microservicio pide varios parámetros para su correcto funcionamiento. Estos parámetros son:

```sh
StageName= Nombre del stage "prod" | "dev"
vpceIds= vpce para conexión con los demás microservicios
securityGroupIds= securityGroupsIds para conexión con los demás microservicios
subnetIds= subnetIds separado por comas para conexión con los demás microservicios
mongoDbUri= Uri de conexión para mongo db
clientName= nombre del cliente para el que se está desplegando
taskScheduleTable= nombre de la tabla creado por el task scheduling service
newProductsServiceUrl= Url del new products service con el cuál se comunicará
```

Una vez desplegado, en la terminal aparecerá la información requerida para configurar los demás microservicios.

## Uso

Este microservicio se puede utilizar a través de los endpoints que expone. A continuación un enlace a la colección de [postman](https://drive.google.com/file/d/1G5ULFd4bz5xGf_3TdlZntg42Rs2tDIN5/view?usp=drive_link) de esta solución.

## Contact

Alexander Tigselema
alexander.tigselema@trade.ec

Brayan Burgos
brayan.burgos@trade.ec
