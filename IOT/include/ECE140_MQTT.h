#ifndef ECE140_MQTT_h
#define ECE140_MQTT_h

#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

/**
 * @brief Class to handle MQTT communications using a secure connection.
 */
class ECE140_MQTT {
public:
    /**
     * @brief Basic constructor.
     *
     * @param clientId    Unique MQTT client identifier.
     * @param topicPrefix Topic prefix for published/subscribed topics.
     */
    ECE140_MQTT(String clientId, String topicPrefix);

    /**
     * @brief Overloaded constructor with broker details and credentials.
     *
     * @param clientId    Unique MQTT client identifier.
     * @param topicPrefix Topic prefix for published/subscribed topics.
     * @param broker      MQTT broker hostname.
     * @param port        MQTT broker port (e.g. 8883 for TLS).
     * @param user        Username (if required).
     * @param pass        Password (if required).
     */
    ECE140_MQTT(String clientId, String topicPrefix,
                const char* broker, int port,
                const char* user, const char* pass);

    /**
     * @brief Connect to the MQTT broker.
     *
     * @return true  if connection is successful.
     * @return false if connection fails.
     */
    bool connectToBroker();

    /**
     * @brief Publish a message to a subtopic.
     *
     * @param subtopic Subtopic (appended to topicPrefix).
     * @param message  The message payload.
     * @return true  if publish succeeded.
     * @return false if publish failed.
     */
    bool publishMessage(String subtopic, String message);

    /**
     * @brief Subscribe to a subtopic.
     *
     * @param subtopic Subtopic (appended to topicPrefix).
     * @return true  if subscription succeeded.
     * @return false if subscription failed.
     */
    bool subscribeTopic(String subtopic);

    /**
     * @brief Set a callback function for incoming messages.
     *
     * @param callback Function pointer for the callback.
     */
    void setCallback(MQTT_CALLBACK_SIGNATURE);

    /**
     * @brief Maintain the MQTT connection.
     */
    void loop();

private:
    // Secure WiFi client for TLS connection
    WiFiClientSecure _wifiClient;
    PubSubClient*    _mqttClient;

    String           _clientId;
    String           _topicPrefix;
    
    // Broker connection details
    const char*      _broker;
    int              _port;
    const char*      _user;
    const char*      _pass;

    /**
     * @brief Helper function to initialize the PubSubClient.
     */
    void _setupMQTTClient();
};

#endif