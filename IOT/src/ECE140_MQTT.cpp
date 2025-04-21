#include "ECE140_MQTT.h"

ECE140_MQTT::ECE140_MQTT(String clientId, String topicPrefix)
    : _mqttClient(nullptr),
      _clientId(clientId),
      _topicPrefix(topicPrefix),
      _broker("broker.hivemq.com"), // default fallback
      _port(8883),
      _user(nullptr),
      _pass(nullptr)
{
}

ECE140_MQTT::ECE140_MQTT(String clientId, String topicPrefix,
                         const char* broker, int port,
                         const char* user, const char* pass)
    : _mqttClient(nullptr),
      _clientId(clientId),
      _topicPrefix(topicPrefix),
      _broker(broker),
      _port(port),
      _user(user),
      _pass(pass)
{
}

bool ECE140_MQTT::connectToBroker() {
    if (!_mqttClient) {
        _setupMQTTClient();
    }

    bool connected;
    if (_user && _pass && strlen(_user) > 0 && strlen(_pass) > 0) {
        connected = _mqttClient->connect(_clientId.c_str(), _user, _pass);
    } else {
        connected = _mqttClient->connect(_clientId.c_str());
    }
    return connected;
}

bool ECE140_MQTT::publishMessage(String subtopic, String message) {
    if (!_mqttClient || !_mqttClient->connected()) {
        return false;
    }
    String fullTopic = _topicPrefix + "/" + subtopic;
    return _mqttClient->publish(fullTopic.c_str(), message.c_str());
}

bool ECE140_MQTT::subscribeTopic(String subtopic) {
    if (!_mqttClient || !_mqttClient->connected()) {
        return false;
    }
    String fullTopic = _topicPrefix + "/" + subtopic;
    return _mqttClient->subscribe(fullTopic.c_str());
}

void ECE140_MQTT::setCallback(MQTT_CALLBACK_SIGNATURE) {
    if (!_mqttClient) {
        _setupMQTTClient();
    }
    _mqttClient->setCallback(callback);
}

void ECE140_MQTT::loop() {
    if (_mqttClient) {
        _mqttClient->loop();
    }
}

void ECE140_MQTT::_setupMQTTClient() {
    // For testing only: bypass certificate validation.
    // In production, load the HiveMQ Cloud CA certificate instead.
    _wifiClient.setInsecure();

    _mqttClient = new PubSubClient(_wifiClient);
    _mqttClient->setServer(_broker, _port);
}