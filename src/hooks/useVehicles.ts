// Hook to provide data services (mock or Firebase)
import { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { mockDb } from '../services/mockFirebase';

// Always use mock data for now to ensure compatibility
const useMockData = true;

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      console.log('Loading vehicles using mock data');
      
      const vehiclesRef = mockDb.collection('vehicles');
      const querySnapshot = await vehiclesRef.get();
      const vehiclesList: Vehicle[] = [];
      
      querySnapshot.docs.forEach((doc) => {
        const vehicleData = doc.data();
        vehiclesList.push({ ...vehicleData, id: vehicleData.id || doc.id } as Vehicle);
      });

      setVehicles(vehiclesList);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding vehicle using mock data');
      const vehiclesRef = mockDb.collection('vehicles');
      const docRef = await vehiclesRef.add({
        ...vehicleData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const newVehicle = {
        id: docRef.id,
        ...vehicleData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Vehicle;
      
      setVehicles(prev => [...prev, newVehicle]);
      return docRef.id;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      console.log('Updating vehicle using mock data');
      const vehicleRef = mockDb.doc(`vehicles/${vehicleId}`);
      await vehicleRef.update({
        ...updates,
        updatedAt: new Date()
      });
      
      setVehicles(prev => 
        prev.map(vehicle => 
          vehicle.id === vehicleId 
            ? { ...vehicle, ...updates, updatedAt: new Date() }
            : vehicle
        )
      );
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      console.log('Deleting vehicle using mock data');
      const vehicleRef = mockDb.doc(`vehicles/${vehicleId}`);
      await vehicleRef.delete();
      
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  const getVehicle = async (vehicleId: string): Promise<Vehicle | null> => {
    try {
      console.log('Getting vehicle using mock data');
      const vehicleRef = mockDb.doc(`vehicles/${vehicleId}`);
      const doc = await vehicleRef.get();
      
      if (doc.exists()) {
        const vehicleData = doc.data();
        if (vehicleData) {
          return { ...vehicleData, id: vehicleData.id || doc.id } as Vehicle;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting vehicle:', error);
      return null;
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return {
    vehicles,
    loading,
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicle
  };
};
