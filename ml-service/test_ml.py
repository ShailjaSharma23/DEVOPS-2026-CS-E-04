import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"

def test_ml_service():
    print("=" * 60)
    print("      ASTRA ML FORECASTING SERVICE - TEST RUNNER")
    print("=" * 60)

    # 1. Health Endpoint Test
    print("\n[Step 1] Checking ML Service health status...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/health", headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"✓ Health Check Passed: {data}")
            else:
                print(f"✗ Health Check Failed: Status {response.status}")
                return
    except urllib.error.URLError as e:
        print("✗ Connection Error: Could not connect to ML service at http://localhost:8000")
        print("  Please make sure the server is running with: python main.py")
        sys.exit(1)

    # 2. Test Forecasting with Sample Historical Timeline (12 Months)
    print("\n[Step 2] Sending 12-month historical allocation data to Prophet engine...")
    sample_payload = {
        "history": [
            {"ds": "2025-01", "y": 30.0},
            {"ds": "2025-02", "y": 32.0},
            {"ds": "2025-03", "y": 35.0},
            {"ds": "2025-04", "y": 38.0},
            {"ds": "2025-05", "y": 39.0},
            {"ds": "2025-06", "y": 42.0},
            {"ds": "2025-07", "y": 43.0},
            {"ds": "2025-08", "y": 46.0},
            {"ds": "2025-09", "y": 48.0},
            {"ds": "2025-10", "y": 50.0},
            {"ds": "2025-11", "y": 52.0},
            {"ds": "2025-12", "y": 55.0}
        ],
        "horizon": 6
    }

    try:
        post_data = json.dumps(sample_payload).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/api/v1/ml/forecast",
            data=post_data,
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                predictions = data.get("predictions", [])
                metrics = data.get("metrics", {})

                print("✓ Forecast generated successfully!")
                print("\n--- MODEL PERFORMANCE METRICS ---")
                print(f"  MAE  (Mean Absolute Error):     {metrics.get('mae', 0):.2f}")
                print(f"  RMSE (Root Mean Squared Error): {metrics.get('rmse', 0):.2f}")
                print(f"  MAPE (Mean Absolute % Error):   {metrics.get('mape', 0):.2f}%")

                print("\n--- 6-MONTH PREDICTED ALLOCATIONS ---")
                print(f"  {'Period':<10} {'Predicted':<12} {'Lower Bound':<14} {'Upper Bound':<14}")
                print("  " + "-" * 50)
                for p in predictions:
                    print(f"  {p['period']:<10} {p['predictedValue']:<12.1f} {p['lowerBound']:<14.1f} {p['upperBound']:<14.1f}")

                print("\n" + "=" * 60)
                print("✓ ALL TESTS PASSED: Prophet ML model is operational and ready!")
                print("=" * 60)
            else:
                print(f"✗ Forecasting returned status {response.status}")

    except urllib.error.HTTPError as e:
        error_msg = e.read().decode()
        print(f"✗ Server error {e.code}: {error_msg}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error during forecast execution: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_ml_service()
